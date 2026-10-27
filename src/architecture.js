// Rooms, apertures, wall collision, and roofs share one measured layout.
const EPS = 1e-5;

export function compileLayout(plan) {
  const rooms = plan.rooms.map(room => ({
    height: 4.8, color: 0x304650, floor: 0x2d424a, ...room,
    minX: room.x - room.w / 2, maxX: room.x + room.w / 2,
    minZ: room.z - room.d / 2, maxZ: room.z + room.d / 2,
  }));
  const byId = new Map(rooms.map(room => [room.id, room]));
  if (byId.size !== rooms.length) throw Error('Duplicate room identifier');
  for (let i = 0; i < rooms.length; i++) {
    const a = rooms[i];
    for (const b of rooms.slice(i + 1)) {
      if (Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX) > EPS &&
          Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ) > EPS) {
        throw Error(`Overlapping rooms: ${a.id} / ${b.id}`);
      }
    }
  }
  const portals = (plan.portals || []).map(spec => {
    const a = byId.get(spec.a), b = byId.get(spec.b);
    if (!a || (spec.b && !b)) throw Error(`Unknown room at ${spec.id}`);
    let axis, line, lo, hi;
    if (b) {
      if (Math.abs(a.maxZ - b.minZ) < EPS || Math.abs(b.maxZ - a.minZ) < EPS) {
        axis = 'x'; line = Math.abs(a.maxZ - b.minZ) < EPS ? a.maxZ : b.maxZ;
        lo = Math.max(a.minX, b.minX); hi = Math.min(a.maxX, b.maxX);
      } else if (Math.abs(a.maxX - b.minX) < EPS || Math.abs(b.maxX - a.minX) < EPS) {
        axis = 'z'; line = Math.abs(a.maxX - b.minX) < EPS ? a.maxX : b.maxX;
        lo = Math.max(a.minZ, b.minZ); hi = Math.min(a.maxZ, b.maxZ);
      } else throw Error(`Rooms do not share a wall: ${spec.id}`);
    } else {
      axis = ['north', 'south'].includes(spec.side) ? 'x' : 'z';
      line = { north: a.minZ, south: a.maxZ, west: a.minX, east: a.maxX }[spec.side];
      lo = axis === 'x' ? a.minX : a.minZ; hi = axis === 'x' ? a.maxX : a.maxZ;
      if (!Number.isFinite(line)) throw Error(`Missing exterior wall side: ${spec.id}`);
    }
    const at = spec.at ?? (lo + hi) / 2, width = spec.width || 3.8;
    if (at - width / 2 < lo + .2 || at + width / 2 > hi - .2)
      throw Error(`Door exceeds shared wall: ${spec.id}`);
    const base = spec.base || 0, height = spec.height || 3.4;
    if (base + height > Math.min(a.height, b?.height ?? a.height) - .2)
      throw Error(`Aperture exceeds ceiling: ${spec.id}`);
    return { ...spec, axis, line, at, width, height, base,
      start: at - width / 2, end: at + width / 2,
      x: axis === 'x' ? at : line, z: axis === 'x' ? line : at };
  });
  const lines = new Map();
  const edge = (axis, line, start, end, room) => {
    const key = `${axis}:${line}`;
    if (!lines.has(key)) lines.set(key, { axis, line, edges: [] });
    lines.get(key).edges.push({ start, end, room });
  };
  for (const room of rooms) {
    edge('x', room.minZ, room.minX, room.maxX, room);
    edge('x', room.maxZ, room.minX, room.maxX, room);
    edge('z', room.minX, room.minZ, room.maxZ, room);
    edge('z', room.maxX, room.minZ, room.maxZ, room);
  }
  const walls = [];
  for (const line of lines.values()) {
    const apertures = portals.filter(p => p.axis === line.axis && Math.abs(p.line - line.line) < EPS);
    const breaks = [...new Set([
      ...line.edges.flatMap(e => [e.start, e.end]),
      ...apertures.flatMap(p => [p.start, p.end]),
    ])].sort((a, b) => a - b);
    for (let i = 1; i < breaks.length; i++) {
      const start = breaks[i - 1], end = breaks[i], mid = (start + end) / 2;
      const covering = line.edges.filter(e => mid > e.start - EPS && mid < e.end + EPS);
      if (!covering.length || end - start < EPS) continue;
      const room = covering.reduce((a, b) => a.room.height >= b.room.height ? a : b).room;
      const aperture = apertures.find(p => mid > p.start && mid < p.end);
      const add = (minY, maxY) => {
        if (maxY - minY > EPS) walls.push({ axis: line.axis, line: line.line, start, end,
          minY, maxY, color: room.color, roomIds: covering.map(e => e.room.id) });
      };
      if (!aperture) add(0, room.height);
      else { add(0, aperture.base); add(aperture.base + aperture.height, room.height); }
    }
  }
  return { name: plan.name, rooms, portals, walls };
}

export const FACILITY = {
  name: 'Kestrel Logistics',
  rooms: [
    { id: 'airlock', name: 'Arrival airlock', x: 0, z: 30, w: 12, d: 8, height: 4.6 },
    { id: 'cargo', name: 'Cargo receiving', x: 0, z: 15, w: 28, d: 22, height: 5.6 },
    { id: 'loading', name: 'Loading & inspection', x: 0, z: -3, w: 28, d: 14 },
    { id: 'office', name: 'Inspection office', x: -20, z: 1, w: 12, d: 22, height: 4.4 },
    { id: 'west-service', name: 'Staff service passage', x: -18, z: -18, w: 8, d: 16, height: 3.8 },
    { id: 'relay', name: 'Security service entry', x: -12, z: -23, w: 4, d: 6, height: 3.8 },
    { id: 'security', name: 'Security checkpoint', x: 0, z: -18, w: 20, d: 16 },
    { id: 'east-link', name: 'Cooling access', x: 15, z: -22, w: 10, d: 8 },
    { id: 'service-entry', name: 'Maintenance access', x: 18, z: 19, w: 8, d: 8, height: 3.8 },
    { id: 'service-south', name: 'Service control', x: 26, z: 14, w: 8, d: 18, height: 3.8 },
    { id: 'service-north', name: 'Maintenance bypass', x: 26, z: -10.5, w: 8, d: 31, height: 3.8 },
    { id: 'cooling', name: 'Thermal exchange', x: 17, z: -41, w: 26, d: 30, height: 5.6 },
    { id: 'core-link', name: 'Core approach', x: 17, z: -60, w: 8, d: 8 },
    { id: 'core', name: 'Power core 03', x: -3, z: -78, w: 48, d: 28, height: 9.2 },
    { id: 'archive', name: 'Isolated audit archive', x: 27, z: -80, w: 12, d: 16 },
  ],
  portals: [
    { id: 'exfil-hatch', a: 'airlock', side: 'south', at: 0, width: 4.4, closed: true, label: 'RAPSCALLION / EXTRACTION' },
    { id: 'arrival-cargo', a: 'airlock', b: 'cargo', at: 0, width: 4.6 },
    { id: 'cargo-loading', a: 'cargo', b: 'loading', at: -5, width: 5 },
    { id: 'cargo-office', a: 'cargo', b: 'office', at: 8, width: 3.4, color: 0xe3bf83 },
    { id: 'office-window', a: 'office', b: 'loading', at: -7.4, width: 2.2, base: 1.35, height: 1.4, window: true },
    { id: 'office-loading', a: 'office', b: 'loading', at: -3, width: 3.4 },
    { id: 'office-service', a: 'office', b: 'west-service', at: -18, width: 3, color: 0xe3bf83 },
    { id: 'service-relay', a: 'west-service', b: 'relay', at: -23, width: 2.8 },
    { id: 'relay-security', a: 'relay', b: 'security', at: -23, width: 2.8 },
    { id: 'loading-security', a: 'loading', b: 'security', at: 0, width: 4.2 },
    { id: 'security-east', a: 'security', b: 'east-link', at: -22, width: 4 },
    { id: 'east-cooling', a: 'east-link', b: 'cooling', at: 17, width: 4.2 },
    { id: 'cargo-maintenance', a: 'cargo', b: 'service-entry', at: 19, width: 3.2, color: 0xe3bf83 },
    { id: 'service-dogleg', a: 'service-entry', b: 'service-south', at: 19, width: 3.2, color: 0xe3bf83 },
    { id: 'maintenance-gate', a: 'service-south', b: 'service-north', at: 26, width: 3.2, height: 3.2, gate: true, closed: true, color: 0xe3bf83 },
    { id: 'maintenance-cooling', a: 'service-north', b: 'cooling', at: 26, width: 3.2, color: 0xe3bf83 },
    { id: 'cooling-core', a: 'cooling', b: 'core-link', at: 17, width: 4.4 },
    { id: 'core-entry', a: 'core-link', b: 'core', at: 17, width: 4.4 },
    { id: 'core-archive', a: 'core', b: 'archive', at: -80, width: 3.8, color: 0xe3bf83 },
  ],
};

export const SHIP = {
  name: 'Rapscallion',
  rooms: [
    { id: 'crew-deck', name: 'Crew deck', x: 0, z: 3, w: 8, d: 38, height: 4.6 },
    { id: 'lounge', name: 'Crew lounge', x: -9.25, z: 3, w: 10.5, d: 38, height: 4.6, floor: 0x3e4647 },
    { id: 'engineering', name: 'Engineering', x: 9.25, z: 3, w: 10.5, d: 38, height: 4.6 },
    { id: 'bridge', name: 'Bridge', x: 0, z: -22, w: 20, d: 12, height: 4.8 },
  ],
  portals: [
    { id: 'bridge-door', a: 'crew-deck', b: 'bridge', at: 0, width: 5 },
    { id: 'lounge-door', a: 'crew-deck', b: 'lounge', at: 2, width: 4 },
    { id: 'engineering-door', a: 'crew-deck', b: 'engineering', at: 2, width: 4 },
    { id: 'ship-airlock', a: 'crew-deck', side: 'south', width: 4.4, closed: true, label: 'DOCK 07 / ANCHORAGE' },
    { id: 'bridge-window', a: 'bridge', side: 'north', width: 18, base: 1.1, height: 3.2, window: true },
  ],
};

export const WRECK = {
  name: 'Peregrine',
  rooms: [
    { id: 'bow', name: 'Bow airlock', x: 0, z: 20, w: 12, d: 8, height: 4.6 },
    { id: 'cargo', name: 'Cargo deck', x: 0, z: 3, w: 26, d: 26, height: 5.6 },
    { id: 'spine', name: 'Service spine', x: 0, z: -31, w: 8, d: 42, height: 4.2 },
    { id: 'lab', name: 'Sensor laboratory', x: -19, z: -5, w: 12, d: 24, height: 4.6 },
    { id: 'survey', name: 'Survey operations', x: 14, z: -33, w: 20, d: 24, height: 4.6 },
    { id: 'crew', name: 'Crew service rooms', x: -11, z: -31, w: 14, d: 24, height: 4.2 },
    { id: 'engines', name: 'Aft engineering', x: 0, z: -66, w: 26, d: 28, height: 5.6 },
  ],
  portals: [
    { id: 'bow-hatch', a: 'bow', side: 'south', width: 4.4, closed: true, label: 'RAPSCALLION / EXFIL' },
    { id: 'bow-cargo', a: 'bow', b: 'cargo', width: 4.4 },
    { id: 'cargo-spine', a: 'cargo', b: 'spine', width: 4.2 },
    { id: 'cargo-lab', a: 'cargo', b: 'lab', at: -2, width: 4 },
    { id: 'spine-survey', a: 'spine', b: 'survey', at: -33, width: 4 },
    { id: 'crew-forward', a: 'spine', b: 'crew', at: -23, width: 3 },
    { id: 'crew-aft', a: 'spine', b: 'crew', at: -39, width: 3 },
    { id: 'spine-engineering', a: 'spine', b: 'engines', width: 4.2 },
  ],
};

export const REFINERY = {
  name: 'Ember Reach',
  rooms: [
    { id: 'landing', name: 'Landing airlock', x: 0, z: 39, w: 12, d: 10, height: 4.8 },
    { id: 'refinery', name: 'Thermal refinery', x: 0, z: -39, w: 34, d: 32, height: 6.2, color: 0x655b4e, floor: 0x55594e },
    { id: 'vault', name: 'Regulator vault', x: 0, z: -60, w: 14, d: 10, height: 4.8, color: 0x655b4e },
    { id: 'utility', name: 'Utility service', x: -12, z: -60, w: 10, d: 10, height: 4.8, color: 0x655b4e },
    { id: 'stores', name: 'Refinery stores', x: 12, z: -60, w: 10, d: 10, height: 4.8, color: 0x655b4e },
  ],
  portals: [
    { id: 'landing-entrance', a: 'landing', side: 'north', width: 5 },
    { id: 'landing-hatch', a: 'landing', side: 'south', width: 4.4, closed: true, label: 'RAPSCALLION / EXFIL' },
    { id: 'refinery-entry', a: 'refinery', side: 'south', width: 7, height: 4.2 },
    { id: 'refinery-vault', a: 'refinery', b: 'vault', width: 4 },
    { id: 'refinery-utility', a: 'refinery', b: 'utility', at: -12, width: 3.2 },
    { id: 'refinery-stores', a: 'refinery', b: 'stores', at: 12, width: 3.2 },
    { id: 'utility-vault', a: 'utility', b: 'vault', at: -60, width: 2.8 },
    { id: 'refinery-side', a: 'utility', side: 'west', at: -60, width: 3, color: 0xe3bf83 },
  ],
};

export const PORT_DOCK = {
  name: 'Dock 07',
  rooms: [{ id: 'dock', name: 'Rapscallion boarding', x: 0, z: 40, w: 12, d: 10, height: 4.8 }],
  portals: [
    { id: 'dock-entry', a: 'dock', side: 'north', width: 5.5 },
    { id: 'dock-hatch', a: 'dock', side: 'south', width: 4.4, closed: true, label: 'RAPSCALLION / BOARDING' },
  ],
};
