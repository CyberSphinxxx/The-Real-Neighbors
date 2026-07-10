import React from 'react';
import { Server, Globe, Shield, Swords, Gamepad2 } from 'lucide-react';

export const MinecraftPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-main tracking-tight flex items-center gap-3">
          <Server className="text-primary w-8 h-8" /> 
          The Real Neighbors MC - Server FAQ
        </h1>
        <p className="text-muted mt-2 text-lg">Everything you need to know about our Paper 26.1.2 survival server.</p>
      </div>

      <div className="space-y-8">
        {/* How to Join */}
        <section className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-main flex items-center gap-2 mb-4">
            <Gamepad2 className="text-primary" /> How to Join
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-main">Q: What is the server IP?</h3>
              <p className="text-muted mt-1 leading-relaxed">A: You can connect to the server using our central domain: <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">play.therealneighbors.online</span>.</p>
              <div className="mt-3 bg-surface border border-border-subtle rounded-lg p-3 text-sm text-muted shadow-sm">
                <strong className="text-main">Backup Addresses:</strong> If the main domain is ever unavailable, use these original direct addresses:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>Java:</strong> <span className="font-mono">how-dept.gl.joinmc.link</span></li>
                  <li><strong>Bedrock:</strong> IP <span className="font-mono">147.185.221.32</span> | Port <span className="font-mono">50909</span></li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-main">Q: Can I play on Bedrock (Mobile, Xbox, PlayStation, Switch)?</h3>
              <div className="text-muted mt-1 leading-relaxed space-y-2">
                <p>A: Yes! We have full cross-play enabled.</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><strong>Java Edition Players:</strong> Simply enter the IP <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">play.therealneighbors.online</span> (or <span className="font-mono">how-dept.gl.joinmc.link</span>) and join.</li>
                  <li><strong>Bedrock Edition Players:</strong> Add a new server, enter the IP <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">play.therealneighbors.online</span> (or <span className="font-mono">147.185.221.32</span>), and set the Port to <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">50909</span>.</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-main">Q: Why can't I see my custom skin on Bedrock?</h3>
              <p className="text-muted mt-1 leading-relaxed">A: Minecraft Bedrock blocks custom skins by default for safety. To fix this, open your Minecraft settings, go to the General tab, and turn OFF the "Only Allow Trusted Skins" option. Our server handles the rest so everyone can see your look!</p>
            </div>
          </div>
        </section>

        {/* Gameplay & Features */}
        <section className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-main flex items-center gap-2 mb-4">
            <Swords className="text-primary" /> Gameplay & Features
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-main">Q: What kind of server is this?</h3>
              <p className="text-muted mt-1 leading-relaxed">A: We are a "Vanilla+" Survival server. This means we keep the core Minecraft experience intact but enhance it with immersive RPG elements, tougher challenges, and quality-of-life upgrades.</p>
            </div>

            <div>
              <h3 className="font-semibold text-main">Q: How do the RPG Skills and Mana work?</h3>
              <p className="text-muted mt-1 leading-relaxed">A: As you perform standard tasks like mining, farming, or fighting, you will level up specific skills and increase your maximum Health and Mana. You can use your Mana to trigger powerful, active abilities (like instantly chopping down entire trees or mining at super-speed).</p>
              <div className="mt-3 bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-main flex items-start gap-2">
                <span className="font-bold text-primary">Tip:</span> 
                <span>Type <code className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">/skills</code> in-game at any time to view your skill tree and stats!</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-main">Q: Why are the monsters so hard?</h3>
              <p className="text-muted mt-1 leading-relaxed">A: The world levels up with you. The further you travel from spawn and the deeper you go, the higher the level the mobs will be. Higher-level mobs hit harder and have more health, but they drop much better loot. Prepare accordingly!</p>
            </div>

            <div>
              <h3 className="font-semibold text-main">Q: Can I sit on stairs or the ground?</h3>
              <p className="text-muted mt-1 leading-relaxed">A: Yes! For a bit of extra immersion, you can right-click any stair block to sit on it. You can also type <code className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">/sit</code>, <code className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">/crawl</code>, or <code className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">/lay</code> anywhere in the world.</p>
            </div>
          </div>
        </section>

        {/* Rules & Protection */}
        <section className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-main flex items-center gap-2 mb-4">
            <Shield className="text-primary" /> Rules & Protection
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-main">Q: How do I protect my house from being destroyed or robbed?</h3>
              <p className="text-muted mt-1 leading-relaxed">A: We use a golden shovel claiming system. When you place your first chest, the land around it is automatically claimed for you. You can expand your territory using a golden shovel and manage who has access to your land by typing <code className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">/claim</code> or <code className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">/trust [playername]</code>.</p>
            </div>

            <div>
              <h3 className="font-semibold text-main">Q: What happens if someone griefs my build?</h3>
              <p className="text-muted mt-1 leading-relaxed">A: Don't worry, your progress is completely safe. The server logs every single block placed, broken, or taken from a chest. If someone breaks into an unclaimed area or causes trouble, our admins can roll back the damage with a single command and permanently ban the offender.</p>
            </div>

            <div>
              <h3 className="font-semibold text-main">Q: Can I use older versions of Minecraft to join?</h3>
              <p className="text-muted mt-1 leading-relaxed">A: Yes, our server supports connections from older client versions. However, for the absolute best experience (and to avoid anti-cheat glitches with vehicles), we highly recommend playing on the latest version (1.21.x).</p>
            </div>
          </div>
        </section>

        {/* Server Summary / Plugins */}
        <section className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-main flex items-center gap-2">
              <Globe className="text-primary" /> Server Plugins & Mods
            </h2>
            <div className="bg-primary/10 text-primary text-sm font-semibold px-3 py-1.5 rounded-full border border-primary/20">
              Note: No download required to play!
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Core Gameplay & RPG */}
            <div>
              <h4 className="font-semibold text-main flex items-center gap-2 mb-3 border-b border-border-subtle pb-2">⚙️ Core Gameplay & RPG</h4>
              <ul className="text-sm text-muted space-y-3">
                <li>
                  <div className="font-semibold text-main">AuraSkills</div>
                  <div className="text-xs mb-1">RPG stats, skill trees, and mana abilities</div>
                  <a href="https://modrinth.com/plugin/auraskills" target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">Modrinth <Globe className="w-3 h-3"/></a>
                </li>
                <li>
                  <div className="font-semibold text-main">LevelledMobs</div>
                  <div className="text-xs mb-1">Scales mob difficulty and loot based on player level/distance</div>
                  <a href="https://modrinth.com/plugin/levelledmobs" target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">Modrinth <Globe className="w-3 h-3"/></a>
                </li>
              </ul>
            </div>

            {/* Admin Tools, Security & Performance */}
            <div>
              <h4 className="font-semibold text-main flex items-center gap-2 mb-3 border-b border-border-subtle pb-2">🛡️ Admin Tools, Security & Performance</h4>
              <ul className="text-sm text-muted space-y-3">
                <li>
                  <div className="font-semibold text-main">CoreProtect</div>
                  <div className="text-xs mb-1">Block logging and rollback for anti-griefing</div>
                  <div className="flex gap-3">
                    <a href="https://modrinth.com/plugin/coreprotect" target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">Modrinth <Globe className="w-3 h-3"/></a>
                    <a href="https://coreprotect.net" target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">Website <Globe className="w-3 h-3"/></a>
                  </div>
                </li>
                <li>
                  <div className="font-semibold text-main">Chunky</div>
                  <div className="text-xs mb-1">World pre-generation to prevent exploration lag</div>
                  <a href="https://modrinth.com/plugin/chunky" target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">Modrinth <Globe className="w-3 h-3"/></a>
                </li>
                <li>
                  <div className="font-semibold text-main">GriefPrevention</div>
                  <div className="text-xs mb-1">Golden shovel land-claiming system for players</div>
                  <a href="https://www.spigotmc.org/resources/griefprevention.1884/" target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">SpigotMC <Globe className="w-3 h-3"/></a>
                </li>
                <li>
                  <div className="font-semibold text-main">GrimAC</div>
                  <div className="text-xs mb-1">Lightweight predictive anti-cheat</div>
                  <a href="https://modrinth.com/plugin/grimac" target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">Modrinth <Globe className="w-3 h-3"/></a>
                </li>
              </ul>
            </div>

            {/* Quality of Life & Cosmetics */}
            <div>
              <h4 className="font-semibold text-main flex items-center gap-2 mb-3 border-b border-border-subtle pb-2">🎨 Quality of Life & Cosmetics</h4>
              <ul className="text-sm text-muted space-y-3">
                <li>
                  <div className="font-semibold text-main">TAB</div>
                  <div className="text-xs mb-1">Customizing the player list header/footer and name tags</div>
                  <a href="https://modrinth.com/plugin/tab" target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">Modrinth <Globe className="w-3 h-3"/></a>
                </li>
                <li>
                  <div className="font-semibold text-main">GSit</div>
                  <div className="text-xs mb-1">Allows players to sit, crawl, and lay down anywhere</div>
                  <a href="https://modrinth.com/plugin/gsit" target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">Modrinth <Globe className="w-3 h-3"/></a>
                </li>
                <li>
                  <div className="font-semibold text-main">SkinsRestorer</div>
                  <div className="text-xs mb-1">Ensures custom skins render properly, especially for offline/Bedrock users</div>
                  <div className="flex gap-3">
                    <a href="https://modrinth.com/plugin/skinsrestorer" target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">Modrinth <Globe className="w-3 h-3"/></a>
                    <a href="https://skinsrestorer.net" target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">Website <Globe className="w-3 h-3"/></a>
                  </div>
                </li>
              </ul>
            </div>

            {/* Cross-Play & Version Compatibility */}
            <div>
              <h4 className="font-semibold text-main flex items-center gap-2 mb-3 border-b border-border-subtle pb-2">🌐 Cross-Play & Version Compatibility</h4>
              <ul className="text-sm text-muted space-y-3">
                <li>
                  <div className="font-semibold text-main">Geyser-Spigot</div>
                  <div className="text-xs mb-1">Translates Java network packets so Bedrock players can join</div>
                  <a href="https://geysermc.org/" target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">Website <Globe className="w-3 h-3"/></a>
                </li>
                <li>
                  <div className="font-semibold text-main">Floodgate</div>
                  <div className="text-xs mb-1">Works with Geyser to let Bedrock players join without needing a Java account</div>
                  <a href="https://geysermc.org/" target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">Website <Globe className="w-3 h-3"/></a>
                </li>
                <li>
                  <div className="font-semibold text-main">ViaVersion</div>
                  <div className="text-xs mb-1">Allows newer Minecraft clients to connect to your server</div>
                  <a href="https://modrinth.com/plugin/viaversion" target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">Modrinth <Globe className="w-3 h-3"/></a>
                </li>
                <li>
                  <div className="font-semibold text-main">ViaBackwards</div>
                  <div className="text-xs mb-1">Allows older Minecraft clients to connect to your server</div>
                  <a href="https://modrinth.com/plugin/viabackwards" target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">Modrinth <Globe className="w-3 h-3"/></a>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MinecraftPage;
