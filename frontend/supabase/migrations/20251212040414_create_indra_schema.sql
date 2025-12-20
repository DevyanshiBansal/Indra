/*
  # Create INDRA Application Schema

  ## Overview
  This migration sets up the complete database schema for the INDRA (Initiative for Drainage and Rainwater Acquisition) application, supporting both Urban (INDRA) and Rural (INDRA-Gramin) modes.

  ## New Tables

  ### 1. assessment_reports
  Stores rainwater harvesting assessment data from users
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `assessment_type` (text) - 'manual' or 'visual'
  - `space_available` (numeric) - in square meters
  - `num_people` (integer)
  - `location` (text)
  - `image_url` (text) - for visual assessments
  - `potential_liters` (numeric) - calculated savings
  - `efficiency_score` (numeric) - 0-100 rating
  - `mode` (text) - 'urban' or 'rural'
  - `created_at` (timestamptz)

  ### 2. vendors
  Stores vendor information for materials and services
  - `id` (uuid, primary key)
  - `name` (text)
  - `location` (text)
  - `materials` (text array) - list of materials offered
  - `contact_phone` (text)
  - `contact_email` (text)
  - `rating` (numeric) - 0-5 stars
  - `created_at` (timestamptz)

  ### 3. gram_panchayat_data
  Stores rural community cluster data
  - `id` (uuid, primary key)
  - `panchayat_name` (text)
  - `location` (text)
  - `total_households` (integer)
  - `total_water_capacity` (numeric) - in liters
  - `irrigation_need` (numeric)
  - `cattle_need` (numeric)
  - `drinking_need` (numeric)
  - `latitude` (numeric)
  - `longitude` (numeric)
  - `created_at` (timestamptz)

  ### 4. water_quality_checks
  Stores water quality analysis results
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `image_url` (text)
  - `turbidity` (text)
  - `ph_level` (numeric)
  - `analysis_result` (text)
  - `simplified_result` (text)
  - `created_at` (timestamptz)

  ### 5. cost_estimates
  Stores cost and implementation plans
  - `id` (uuid, primary key)
  - `assessment_id` (uuid, references assessment_reports)
  - `total_cost` (numeric)
  - `material_cost` (numeric)
  - `labor_cost` (numeric)
  - `timeline_weeks` (integer)
  - `implementation_steps` (jsonb)
  - `diy_option` (boolean)
  - `diy_cost` (numeric)
  - `created_at` (timestamptz)

  ### 6. crop_recommendations
  Stores smart cropping recommendations for rural areas
  - `id` (uuid, primary key)
  - `panchayat_id` (uuid, references gram_panchayat_data)
  - `crop_name` (text)
  - `water_requirement` (numeric) - liters per season
  - `profit_potential` (numeric) - estimated profit
  - `market_price` (numeric)
  - `season` (text)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own data
  - Add policies for public read access to vendors and crop recommendations
*/

-- Create assessment_reports table
CREATE TABLE IF NOT EXISTS assessment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) DEFAULT NULL,
  assessment_type text NOT NULL CHECK (assessment_type IN ('manual', 'visual')),
  space_available numeric NOT NULL,
  num_people integer NOT NULL,
  location text NOT NULL,
  image_url text,
  potential_liters numeric NOT NULL,
  efficiency_score numeric NOT NULL CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
  mode text NOT NULL CHECK (mode IN ('urban', 'rural')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessment_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessments"
  ON assessment_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
  ON assessment_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can insert assessments"
  ON assessment_reports FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Anonymous users can view assessments"
  ON assessment_reports FOR SELECT
  TO anon
  USING (true);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  materials text[] NOT NULL,
  contact_phone text NOT NULL,
  contact_email text NOT NULL,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vendors"
  ON vendors FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create gram_panchayat_data table
CREATE TABLE IF NOT EXISTS gram_panchayat_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  panchayat_name text NOT NULL,
  location text NOT NULL,
  total_households integer NOT NULL,
  total_water_capacity numeric NOT NULL,
  irrigation_need numeric NOT NULL,
  cattle_need numeric NOT NULL,
  drinking_need numeric NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gram_panchayat_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view panchayat data"
  ON gram_panchayat_data FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create water_quality_checks table
CREATE TABLE IF NOT EXISTS water_quality_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) DEFAULT NULL,
  image_url text NOT NULL,
  turbidity text,
  ph_level numeric,
  analysis_result text,
  simplified_result text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE water_quality_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quality checks"
  ON water_quality_checks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quality checks"
  ON water_quality_checks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can insert quality checks"
  ON water_quality_checks FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Create cost_estimates table
CREATE TABLE IF NOT EXISTS cost_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES assessment_reports(id) ON DELETE CASCADE,
  total_cost numeric NOT NULL,
  material_cost numeric NOT NULL,
  labor_cost numeric NOT NULL,
  timeline_weeks integer NOT NULL,
  implementation_steps jsonb NOT NULL,
  diy_option boolean DEFAULT true,
  diy_cost numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cost_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cost estimates"
  ON cost_estimates FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert cost estimates"
  ON cost_estimates FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create crop_recommendations table
CREATE TABLE IF NOT EXISTS crop_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  panchayat_id uuid REFERENCES gram_panchayat_data(id) ON DELETE CASCADE,
  crop_name text NOT NULL,
  water_requirement numeric NOT NULL,
  profit_potential numeric NOT NULL,
  market_price numeric NOT NULL,
  season text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crop_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view crop recommendations"
  ON crop_recommendations FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert sample vendors
INSERT INTO vendors (name, location, materials, contact_phone, contact_email, rating) VALUES
  ('AquaTech Solutions', 'Mumbai', ARRAY['PVC Pipes', 'Storage Tanks', 'Filters'], '+91-9876543210', 'contact@aquatech.in', 4.5),
  ('RainHarvest Pro', 'Delhi', ARRAY['Concrete Rings', 'Pumps', 'Mesh Filters'], '+91-9876543211', 'info@rainharvest.in', 4.8),
  ('EcoWater Systems', 'Bangalore', ARRAY['Storage Tanks', 'UV Filters', 'Pumps'], '+91-9876543212', 'sales@ecowater.in', 4.2),
  ('Green Solutions', 'Pune', ARRAY['PVC Pipes', 'Filters', 'Taps'], '+91-9876543213', 'hello@greensolutions.in', 4.6),
  ('WaterWorks India', 'Chennai', ARRAY['Concrete Rings', 'Storage Tanks', 'Pumps'], '+91-9876543214', 'support@waterworks.in', 4.4),
  ('Rural Water Co', 'Jaipur', ARRAY['Hand Pumps', 'Storage Tanks', 'PVC Pipes'], '+91-9876543215', 'info@ruralwater.in', 4.7);

-- Insert sample gram panchayat data
INSERT INTO gram_panchayat_data (panchayat_name, location, total_households, total_water_capacity, irrigation_need, cattle_need, drinking_need, latitude, longitude) VALUES
  ('Khandala Village', 'Maharashtra', 250, 500000, 200000, 150000, 150000, 18.7515, 73.3926),
  ('Rampur Gram', 'Uttar Pradesh', 180, 350000, 150000, 100000, 100000, 28.6139, 77.2090),
  ('Hosur Panchayat', 'Karnataka', 320, 650000, 280000, 180000, 190000, 12.7342, 77.8292),
  ('Nandgaon Village', 'Gujarat', 210, 420000, 180000, 120000, 120000, 23.0225, 72.5714);

-- Insert sample crop recommendations
INSERT INTO crop_recommendations (panchayat_id, crop_name, water_requirement, profit_potential, market_price, season) VALUES
  ((SELECT id FROM gram_panchayat_data LIMIT 1), 'Millets', 30000, 45000, 35, 'Kharif'),
  ((SELECT id FROM gram_panchayat_data LIMIT 1), 'Pulses', 25000, 50000, 85, 'Rabi'),
  ((SELECT id FROM gram_panchayat_data LIMIT 1), 'Vegetables', 45000, 65000, 25, 'Zaid'),
  ((SELECT id FROM gram_panchayat_data LIMIT 1), 'Cotton', 55000, 70000, 5500, 'Kharif');
