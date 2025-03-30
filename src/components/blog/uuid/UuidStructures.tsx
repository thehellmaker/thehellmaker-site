import React from 'react';
import UuidStructureDiagram from './UuidStructureDiagram';

// UUID v4 Structure
export const UuidV4Structure = () => (
  <UuidStructureDiagram
    title="UUID v4 Structure (128 bits)"
    description="UUID v4 consists of almost entirely random bits, with just a few bits reserved for version and variant. This complete randomness leads to scattered database inserts."
    sections={[
      {
        label: "Random",
        bits: 48,
        color: "#f87171", // red-400
      },
      {
        label: "Random",
        bits: 16,
        color: "#f87171", // red-400
      },
      {
        label: "Ver",
        bits: 4,
        color: "#60a5fa", // blue-400
        description: "Version bits set to 0100 (4)"
      },
      {
        label: "Random",
        bits: 12,
        color: "#f87171", // red-400
      },
      {
        label: "Var",
        bits: 2,
        color: "#60a5fa", // blue-400
        description: "Variant bits set to 10"
      },
      {
        label: "Random",
        bits: 46,
        color: "#f87171", // red-400
      }
    ]}
  />
);

// UUID v7 Structure
export const UuidV7Structure = () => (
  <UuidStructureDiagram
    title="UUID v7 Structure (128 bits)"
    description="UUID v7 places a timestamp in the most significant bits, ensuring chronological ordering while maintaining uniqueness with random bits."
    sections={[
      {
        label: "Timestamp",
        bits: 48,
        color: "#86efac", // green-300
        description: "Unix timestamp in milliseconds"
      },
      {
        label: "Ver",
        bits: 4,
        color: "#60a5fa", // blue-400
        description: "Version bits set to 0111 (7)"
      },
      {
        label: "Random",
        bits: 12,
        color: "#f87171", // red-400
      },
      {
        label: "Var",
        bits: 2,
        color: "#60a5fa", // blue-400
        description: "Variant bits set to 10"
      },
      {
        label: "Random",
        bits: 62,
        color: "#f87171", // red-400
      }
    ]}
  />
);

// Snowflake ID Structure
export const SnowflakeStructure = () => (
  <UuidStructureDiagram
    title="Snowflake ID Structure (64 bits)"
    description="Twitter's Snowflake ID uses a 64-bit structure with timestamp as high-order bits for chronological ordering, machine ID for distributed generation, and sequence number for high throughput."
    sections={[
      {
        label: "Sign",
        bits: 1,
        color: "#e5e7eb", // gray-200
        description: "Always 0 for positive values"
      },
      {
        label: "Timestamp",
        bits: 41,
        color: "#86efac", // green-300
        description: "Milliseconds since custom epoch (~69 years)"
      },
      {
        label: "Machine ID",
        bits: 10,
        color: "#fcd34d", // yellow-300
        description: "Unique generator node ID (1024 nodes)"
      },
      {
        label: "Sequence",
        bits: 12,
        color: "#c4b5fd", // purple-300
        description: "Counter (4096 IDs per ms per node)"
      }
    ]}
  />
);

// ULID Structure
export const UlidStructure = () => (
  <UuidStructureDiagram
    title="ULID Structure (128 bits)"
    description="ULIDs combine timestamp ordering with sufficient randomness, encoded in Crockford's base32 for human readability and lexicographic sorting."
    sections={[
      {
        label: "Timestamp",
        bits: 48,
        color: "#86efac", // green-300
        description: "Milliseconds since Unix epoch"
      },
      {
        label: "Randomness",
        bits: 80,
        color: "#f87171", // red-400
        description: "Cryptographic randomness"
      }
    ]}
  />
);

// Combined component that exports all structures
const UuidStructures = {
  UuidV4Structure,
  UuidV7Structure,
  SnowflakeStructure,
  UlidStructure
};

export default UuidStructures; 