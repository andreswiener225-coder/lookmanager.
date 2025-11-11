-- Migration 0002: Add Property Groups Support
-- Allows creating parent-child relationships (Building -> Apartments)

-- Add columns for property grouping
ALTER TABLE properties ADD COLUMN parent_property_id INTEGER;
ALTER TABLE properties ADD COLUMN unit_number TEXT;
ALTER TABLE properties ADD COLUMN is_group INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN floor_number INTEGER;

-- Create index for parent-child queries
CREATE INDEX IF NOT EXISTS idx_properties_parent ON properties(parent_property_id);

-- Add foreign key constraint (soft, SQLite doesn't enforce)
-- FOREIGN KEY (parent_property_id) REFERENCES properties(id) ON DELETE SET NULL

-- Update existing properties to be standalone (not part of a group)
UPDATE properties SET is_group = 0 WHERE is_group IS NULL;
UPDATE properties SET parent_property_id = NULL WHERE parent_property_id IS NULL;

-- Comments for clarity:
-- is_group: 1 = Parent property (building), 0 = Child/Standalone
-- parent_property_id: NULL = Standalone/Parent, NUMBER = Child of that parent
-- unit_number: Ex: "Apt 1A", "Bureau 205", "Suite 3B"
-- floor_number: For multi-story buildings
