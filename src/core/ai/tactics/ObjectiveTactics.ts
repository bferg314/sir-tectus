import { Player } from '../../../entities/Player';
import { BotContext } from '../BotTypes';
import { BotSensory } from '../BotSensory';
import { PlayerInputState } from '../../InputManager';

export interface ObjectiveGoal {
  targetX: number;
  targetY: number;
  isEmergency: boolean;
  goalType: 'bubble' | 'boss' | 'sandwich' | 'coin' | 'exit' | 'leader';
}

export class ObjectiveTactics {
  /**
   * Evaluates current game objectives and determines the bot's navigational target
   */
  public static evaluateGoal(ctx: BotContext, input: PlayerInputState): ObjectiveGoal {
    const { bot, memory, players, level, sandwich, coins, boss, dt } = ctx;

    // 1. EMERGENCY REVIVE PRIORITY: Any ally trapped in a soul bubble
    const bubbleAlly = players.find(p => p !== bot && p.isInBubble);
    if (bubbleAlly) {
      const bubbleDist = Math.hypot(bubbleAlly.x - bot.x, bubbleAlly.y - (bot.y - 18));
      if (bubbleDist < 75) {
        input.attack = true;
        input.attackPressed = true;
      }
      return {
        targetX: bubbleAlly.x,
        targetY: bubbleAlly.y,
        isEmergency: true,
        goalType: 'bubble'
      };
    }

    // 2. BOSS BATTLE: Lord Crustifer priority
    if (boss && boss.isAlive) {
      return {
        targetX: boss.x + (bot.index % 2 === 0 ? -160 : 160),
        targetY: boss.y,
        isEmergency: false,
        goalType: 'boss'
      };
    }

    // 3. MAP 5: The Golden Sandwich Extraction
    if (sandwich && sandwich.isDispensed && level) {
      const altar = level.extractionAltarPos;
      // If this bot is carrying the sandwich, route directly to the Extraction Altar!
      if (sandwich.carrierIndex === bot.index && altar) {
        return {
          targetX: altar.x,
          targetY: altar.y,
          isEmergency: true,
          goalType: 'sandwich'
        };
      }

      // If the sandwich dropped onto the ground, pick it up!
      if (sandwich.carrierIndex < 0) {
        return {
          targetX: sandwich.x,
          targetY: sandwich.y,
          isEmergency: true,
          goalType: 'sandwich'
        };
      }
    }

    // 4. MAPS 1-4: Smart Coin Scavenging for the 12-Coin Golden Gate
    const stage = ctx.game.runManager.currentStage;
    const coinsCollected = ctx.game.runManager.coinsCollectedThisStage;
    if (stage < 5 && coinsCollected < 12) {
      const nearbyCoin = BotSensory.findNearestReachableCoin(
        bot,
        coins,
        ctx.platforms,
        ctx.hazards,
        220
      );
      if (nearbyCoin) {
        return {
          targetX: nearbyCoin.x,
          targetY: nearbyCoin.y,
          isEmergency: false,
          goalType: 'coin'
        };
      }
    }

    // 5. UNLOCKED EXIT GATE NAVIGATION (When all 12 coins collected and leader dead/near exit)
    if (level && stage < 5 && coinsCollected >= 12) {
      const exit = level.exitPoint;
      const leader = players.find(p => !p.isCpu && p.isAlive && !p.isInBubble);
      if (!leader || Math.hypot(leader.x - exit.x, leader.y - exit.y) < 200) {
        return {
          targetX: exit.x,
          targetY: exit.y,
          isEmergency: false,
          goalType: 'exit'
        };
      }
    }

    // 6. DEFAULT CO-OP FORMATION: Escort & Flank Living Leader
    let leader = players.find(p => !p.isCpu && p.isAlive && !p.isInBubble);
    if (!leader) {
      leader = players.find(p => p !== bot && p.isAlive && !p.isInBubble);
    }

    if (leader) {
      const flankSide = (bot.index % 2 === 0) ? -1 : 1;
      const flankOffset = flankSide * (85 + (bot.index * 15));
      const targetX = leader.x + flankOffset;

      if (leader.isGrounded || memory.leaderGroundedY === undefined) {
        memory.leaderGroundedY = leader.y;
      }

      return {
        targetX,
        targetY: memory.leaderGroundedY,
        isEmergency: false,
        goalType: 'leader'
      };
    }

    // Fallback: hold current position
    return {
      targetX: bot.x,
      targetY: bot.y,
      isEmergency: false,
      goalType: 'leader'
    };
  }
}
