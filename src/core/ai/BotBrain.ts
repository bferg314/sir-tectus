import { Player } from '../../entities/Player';
import { Game } from '../Game';
import { PlayerInputState } from '../InputManager';
import { BotContext, BotMemory, createDefaultBotInput } from './BotTypes';
import { BotSensory } from './BotSensory';
import { NavTactics } from './tactics/NavTactics';
import { CombatTactics } from './tactics/CombatTactics';
import { KnightTactics } from './tactics/KnightTactics';
import { ObjectiveTactics } from './tactics/ObjectiveTactics';

export class BotBrain {
  private memories: Map<number, BotMemory> = new Map();

  /**
   * Resets or clears memory for all bots (e.g. on new run or stage transition)
   */
  public reset(): void {
    this.memories.clear();
  }

  /**
   * Generates input state for a companion bot on each game loop tick
   */
  public getBotInput(bot: Player, game: Game, dt: number): PlayerInputState {
    const input = createDefaultBotInput();
    if (!bot.isAlive || bot.isInBubble) {
      return input;
    }

    // Retrieve or initialize memory for this bot
    let memory = this.memories.get(bot.index);
    if (!memory) {
      memory = {
        botStuckTimer: 0,
        groundedTimer: 0,
        jumpHoldTimer: 0,
        jumpCooldown: 0,
        doubleJumpDelay: 0,
        airTime: 0,
        bouncerCooldown: 0,
        leaderGroundedY: bot.y,
        ledgeWaitTimer: 0,
        dropThroughCooldown: 0,
        dashCooldown: 0,
        botAbilityCooldown: 0,
        bowAimTimer: 0,
        kitingTimer: 0,
        kitingDir: 0,
        separationTimer: 0,
        lastSafeX: bot.x,
        lastSafeY: bot.y,
        reviveStrikeTimer: 0,
        currentTargetType: 'leader',
        targetX: bot.x,
        targetY: bot.y
      };
      this.memories.set(bot.index, memory);
    }

    // Two-way synchronization with bot instance for backwards compatibility with tests
    const botAny = bot as any;
    if (botAny.airTime !== undefined) memory.airTime = botAny.airTime;
    if (botAny.doubleJumpDelay !== undefined) memory.doubleJumpDelay = botAny.doubleJumpDelay;
    if (botAny.jumpCooldown !== undefined) memory.jumpCooldown = botAny.jumpCooldown;
    if (botAny.groundedTimer !== undefined) memory.groundedTimer = botAny.groundedTimer;
    if (botAny.botStuckTimer !== undefined) memory.botStuckTimer = botAny.botStuckTimer;
    if (botAny.jumpHoldTimer !== undefined) memory.jumpHoldTimer = botAny.jumpHoldTimer;

    // Decrement timers
    if (memory.jumpCooldown > 0) memory.jumpCooldown -= dt;
    if (memory.doubleJumpDelay > 0) memory.doubleJumpDelay -= dt;
    if (memory.bouncerCooldown > 0) memory.bouncerCooldown -= dt;
    if (memory.dropThroughCooldown > 0) memory.dropThroughCooldown -= dt;
    if (memory.dashCooldown > 0) memory.dashCooldown -= dt;

    const platforms = game.currentLevel?.platforms ?? [];
    const hazards = game.currentLevel?.hazards ?? [];

    // Assemble sensory context
    const ctx: BotContext = {
      bot,
      memory,
      game,
      level: game.currentLevel,
      platforms,
      hazards,
      players: game.players,
      enemies: game.enemies,
      projectiles: game.projectiles,
      coins: game.coins,
      sandwich: game.sandwich,
      boss: game.boss,
      dt
    };

    // 1. OBJECTIVE EVALUATION: Determine target destination & urgency
    const goal = ObjectiveTactics.evaluateGoal(ctx, input);
    memory.currentTargetType = goal.goalType;
    memory.targetX = goal.targetX;
    memory.targetY = goal.targetY;

    // 2. NAVIGATION & TRAVERSAL: Platform-aware movement, cliff sensing, jumping
    NavTactics.execute(ctx, input, goal.targetX, goal.targetY, goal.isEmergency);

    // 3. COMBAT & WEAPONRY: Melee attacks, down-thrust pogo, bow sniping, boss battle
    CombatTactics.execute(ctx, input, goal.isEmergency);

    // 4. CLASS SPECIALIZATION: Reflect shields, triple jumps, hydro air dashes, sword throws
    KnightTactics.execute(ctx, input, goal.targetX, goal.targetY);

    // 5. REACTIVE HAZARD OVERRIDES (Spikes, Lava, Fire Vents, Pendulum Blades)
    this.applyHazardOverrides(ctx, input);

    // Sync state back to bot instance for test inspection
    botAny.airTime = memory.airTime;
    botAny.doubleJumpDelay = memory.doubleJumpDelay;
    botAny.jumpCooldown = memory.jumpCooldown;
    botAny.groundedTimer = memory.groundedTimer;
    botAny.botStuckTimer = memory.botStuckTimer;
    botAny.jumpHoldTimer = memory.jumpHoldTimer;

    return input;
  }

  /**
   * Emergency reactions when standing on or directly adjacent to hazardous surfaces
   */
  private applyHazardOverrides(ctx: BotContext, input: PlayerInputState): void {
    const { bot, memory, hazards } = ctx;

    // A. Fire Vents
    const ventDanger = hazards.find(h =>
      h.type === 'fire_vent' &&
      (h.state === 'warning' || h.state === 'active') &&
      bot.x >= h.x - 24 && bot.x <= h.x + h.w + 24 &&
      Math.abs(bot.y - h.y) < 55
    );
    if (ventDanger) {
      const escapeDir = bot.x > (ventDanger.x + ventDanger.w * 0.5) ? 1 : -1;
      input.moveX = escapeDir;
      if (bot.isGrounded && memory.jumpCooldown <= 0) {
        input.jump = true;
        input.jumpPressed = true;
        memory.jumpHoldTimer = 0.35;
        memory.jumpCooldown = 0.8;
      }
    }

    // B. Pendulum Blade Traps
    const bladeDanger = hazards.find(h => {
      if (h.type !== 'blade_trap') return false;
      const anchorX = h.anchorX ?? (h.x + h.w * 0.5);
      const anchorY = h.anchorY ?? (h.y - 120);
      const len = h.length ?? 120;
      const bladeX = anchorX + Math.sin(h.angle ?? 0) * len;
      const bladeY = anchorY + Math.cos(h.angle ?? 0) * len;
      return Math.hypot(bladeX - bot.x, bladeY - (bot.y - 20)) < 70;
    });
    if (bladeDanger) {
      const anchorX = bladeDanger.anchorX ?? (bladeDanger.x + bladeDanger.w * 0.5);
      const bladeX = anchorX + Math.sin(bladeDanger.angle ?? 0) * (bladeDanger.length ?? 120);
      input.moveX = bot.x < bladeX ? -1 : 1;
    }

    // C. Spikes & Lava Emergency Leap
    if (bot.isGrounded && BotSensory.isPointInHazard(bot.x, bot.y, hazards, 16)) {
      input.jump = true;
      input.jumpPressed = true;
      memory.jumpHoldTimer = 0.40;
      memory.jumpCooldown = 0.6;
    }
  }
}
