-- ============================================================================
-- PG MANAGEMENT SYSTEM - COMPREHENSIVE TEST / SEED DATA SCRIPT
-- ============================================================================
-- All Users Password: '123456'
-- BCrypt Hash: '$2a$10$IyFZJZ9O/cIDzJtj4TltruFiTRxRyqIEfD2rGiDgDKdwtvIdZjmwW'
-- ============================================================================

-- STEP 0: SAFE CLEANUP / RESET (In reverse FK dependency order)
TRUNCATE TABLE payments, invoices, allocations, complaints, notices, beds, rooms, properties, users RESTART IDENTITY CASCADE;

-- STEP 1: USERS (No foreign keys)
-- Role enum: ROLE_SUPER_ADMIN, ROLE_PG_OWNER, ROLE_STAFF, ROLE_TENANT
INSERT INTO users (id, name, email, password, phone, role, active, is_shadow_user) VALUES
(1, 'Krish Patel', 'krish@gmail.com', '$2a$10$IyFZJZ9O/cIDzJtj4TltruFiTRxRyqIEfD2rGiDgDKdwtvIdZjmwW', '7069810773', 'ROLE_PG_OWNER', true, false),
(2, 'Ansh Patel', 'ansh@gmail.com', '$2a$10$IyFZJZ9O/cIDzJtj4TltruFiTRxRyqIEfD2rGiDgDKdwtvIdZjmwW', '7069810774', 'ROLE_TENANT', true, false),
(3, 'Rajesh Sharma', 'rajesh@gmail.com', '$2a$10$IyFZJZ9O/cIDzJtj4TltruFiTRxRyqIEfD2rGiDgDKdwtvIdZjmwW', '9876543210', 'ROLE_PG_OWNER', true, false),
(4, 'Admin User', 'admin@gmail.com', '$2a$10$IyFZJZ9O/cIDzJtj4TltruFiTRxRyqIEfD2rGiDgDKdwtvIdZjmwW', '9998887770', 'ROLE_SUPER_ADMIN', true, false),
(5, 'Ramesh Staff', 'ramesh@gmail.com', '$2a$10$IyFZJZ9O/cIDzJtj4TltruFiTRxRyqIEfD2rGiDgDKdwtvIdZjmwW', '9876543211', 'ROLE_STAFF', true, false),
(6, 'Rohit Verma', 'rohit@gmail.com', '$2a$10$IyFZJZ9O/cIDzJtj4TltruFiTRxRyqIEfD2rGiDgDKdwtvIdZjmwW', '9823456781', 'ROLE_TENANT', true, false),
(7, 'Priya Shah', 'priya@gmail.com', '$2a$10$IyFZJZ9O/cIDzJtj4TltruFiTRxRyqIEfD2rGiDgDKdwtvIdZjmwW', '9823456782', 'ROLE_TENANT', true, false),
(8, 'Hardik Mehta', 'hardik@gmail.com', '$2a$10$IyFZJZ9O/cIDzJtj4TltruFiTRxRyqIEfD2rGiDgDKdwtvIdZjmwW', '9823456783', 'ROLE_TENANT', true, false),
(9, 'Neha Joshi', 'neha@gmail.com', '$2a$10$IyFZJZ9O/cIDzJtj4TltruFiTRxRyqIEfD2rGiDgDKdwtvIdZjmwW', '9823456784', 'ROLE_TENANT', true, false);

-- STEP 2: PROPERTIES (Depends on users.id via owner_id)
INSERT INTO properties (id, name, address, city, state, total_floors, owner_id) VALUES
(1, 'Radhe PG & Hostels', '402 Sunrise Avenue, SG Highway', 'Ahmedabad', 'Gujarat', 3, 1),
(2, 'Gokul Executive Residency', '12 Navrangpura, Near University', 'Ahmedabad', 'Gujarat', 2, 1),
(3, 'Shanti Luxury Living', '88 Koramangala 4th Block', 'Bengaluru', 'Karnataka', 4, 3);

-- STEP 3: ROOMS (Depends on properties.id via property_id)
-- RoomType enum: SINGLE, DOUBLE, TRIPLE, FOUR_SHARING
INSERT INTO rooms (id, property_id, room_number, floor, room_type, base_rent, has_ac) VALUES
(1, 1, '101', 1, 'SINGLE', 12000.00, true),
(2, 1, '102', 1, 'DOUBLE', 8500.00, true),
(3, 1, '201', 2, 'DOUBLE', 7000.00, false),
(4, 1, '202', 2, 'TRIPLE', 5500.00, false),
(5, 1, '301', 3, 'FOUR_SHARING', 4500.00, true),
(6, 2, '101', 1, 'DOUBLE', 9000.00, true),
(7, 2, '102', 1, 'SINGLE', 13000.00, true),
(8, 3, '101', 1, 'SINGLE', 15000.00, true);

-- STEP 4: BEDS (Depends on rooms.id via room_id)
-- BedStatus enum: VACANT, OCCUPIED, MAINTENANCE
INSERT INTO beds (id, room_id, bed_number, status, current_tenant_id) VALUES
-- Room 101 (Single, Property 1)
(1, 1, '101-A', 'OCCUPIED', 2),
-- Room 102 (Double, Property 1)
(2, 2, '102-A', 'OCCUPIED', 6),
(3, 2, '102-B', 'VACANT', NULL),
-- Room 201 (Double, Property 1)
(4, 3, '201-A', 'OCCUPIED', 7),
(5, 3, '201-B', 'OCCUPIED', 8),
-- Room 202 (Triple, Property 1)
(6, 4, '202-A', 'MAINTENANCE', NULL),
(7, 4, '202-B', 'VACANT', NULL),
(8, 4, '202-C', 'VACANT', NULL),
-- Room 301 (Four sharing, Property 1)
(9, 5, '301-A', 'VACANT', NULL),
(10, 5, '301-B', 'VACANT', NULL),
(11, 5, '301-C', 'VACANT', NULL),
(12, 5, '301-D', 'VACANT', NULL),
-- Property 2 Beds
(13, 6, 'G-101-A', 'VACANT', NULL),
(14, 6, 'G-101-B', 'VACANT', NULL),
(15, 7, 'G-102-A', 'VACANT', NULL),
-- Property 3 Beds
(16, 8, 'S-101-A', 'VACANT', NULL);

-- STEP 5: ALLOCATIONS (Depends on users.id via tenant_id, beds.id via bed_id)
-- AllocationStatus enum: ACTIVE, COMPLETED
INSERT INTO allocations (id, tenant_id, bed_id, check_in_date, check_out_date, deposit_amount, monthly_rent, status) VALUES
(1, 2, 1, CURRENT_DATE - INTERVAL '90 days', NULL, 24000.00, 12000.00, 'ACTIVE'),
(2, 6, 2, CURRENT_DATE - INTERVAL '60 days', NULL, 17000.00, 8500.00, 'ACTIVE'),
(3, 7, 4, CURRENT_DATE - INTERVAL '35 days', NULL, 14000.00, 7000.00, 'ACTIVE'),
(4, 8, 5, CURRENT_DATE - INTERVAL '15 days', NULL, 14000.00, 7000.00, 'ACTIVE'),
(5, 9, 3, CURRENT_DATE - INTERVAL '180 days', CURRENT_DATE - INTERVAL '30 days', 8500.00, 8500.00, 'COMPLETED');

-- STEP 6: INVOICES (Depends on allocations.id via allocation_id)
-- InvoiceStatus enum: UNPAID, PARTIALLY_PAID, PAID
-- Unique constraint: (allocation_id, invoice_date)
INSERT INTO invoices (id, allocation_id, invoice_date, due_date, total_amount, amount_paid, status, invoice_month) VALUES
-- Allocation 1 (Ansh Patel, Rent ₹12,000):
-- Past month (Paid)
(1, 1, (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::DATE + INTERVAL '5 days', (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::DATE + INTERVAL '10 days', 12000.00, 12000.00, 'PAID', to_char(CURRENT_DATE - INTERVAL '1 month', 'Mon-YYYY')),
-- Current month (Unpaid / Pending dues)
(2, 1, (date_trunc('month', CURRENT_DATE))::DATE + INTERVAL '5 days', (date_trunc('month', CURRENT_DATE))::DATE + INTERVAL '10 days', 12000.00, 0.00, 'UNPAID', to_char(CURRENT_DATE, 'Mon-YYYY')),

-- Allocation 2 (Rohit Verma, Rent ₹8,500):
-- Past month (Paid)
(3, 2, (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::DATE + INTERVAL '2 days', (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::DATE + INTERVAL '7 days', 8500.00, 8500.00, 'PAID', to_char(CURRENT_DATE - INTERVAL '1 month', 'Mon-YYYY')),
-- Current month (Partially Paid: ₹5,000 paid, ₹3,500 pending)
(4, 2, (date_trunc('month', CURRENT_DATE))::DATE + INTERVAL '2 days', (date_trunc('month', CURRENT_DATE))::DATE + INTERVAL '7 days', 8500.00, 5000.00, 'PARTIALLY_PAID', to_char(CURRENT_DATE, 'Mon-YYYY')),

-- Allocation 3 (Priya Shah, Rent ₹7,000):
-- Current month (Fully Paid ₹7,000 - contributes to current month revenue)
(5, 3, (date_trunc('month', CURRENT_DATE))::DATE + INTERVAL '1 day', (date_trunc('month', CURRENT_DATE))::DATE + INTERVAL '6 days', 7000.00, 7000.00, 'PAID', to_char(CURRENT_DATE, 'Mon-YYYY')),

-- Allocation 4 (Hardik Mehta, Rent ₹7,000):
-- Current month (Unpaid ₹7,000 - contributes to pending dues)
(6, 4, (date_trunc('month', CURRENT_DATE))::DATE + INTERVAL '8 days', (date_trunc('month', CURRENT_DATE))::DATE + INTERVAL '13 days', 7000.00, 0.00, 'UNPAID', to_char(CURRENT_DATE, 'Mon-YYYY'));

-- STEP 7: PAYMENTS (Depends on invoices.id via invoice_id)
-- PaymentMode enum: CASH, UPI, ONLINE, BANK_TRANSFER
INSERT INTO payments (id, invoice_id, amount, payment_date, mode, reference_id, transaction_id, remarks) VALUES
(1, 1, 12000.00, (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::DATE + INTERVAL '6 days', 'UPI', 'UPI/2026/891234', 'TXN_UPI_891234', 'Google Pay rent payment - Ansh'),
(2, 3, 8500.00, (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::DATE + INTERVAL '3 days', 'ONLINE', 'NETBNK_987654321', 'TXN_NB_987654', 'NetBanking monthly rent - Rohit'),
(3, 4, 5000.00, (date_trunc('month', CURRENT_DATE))::DATE + INTERVAL '3 days', 'CASH', 'CASH_REC_0102', 'TXN_CSH_0102', 'Part cash payment towards current month - Rohit'),
(4, 5, 7000.00, (date_trunc('month', CURRENT_DATE))::DATE + INTERVAL '2 days', 'UPI', 'UPI/2026/993412', 'TXN_UPI_993412', 'PhonePe rent payment - Priya');

-- STEP 8: COMPLAINTS (Depends on users.id via tenant_id, properties.id via property_id)
-- ComplaintCategory enum: ELECTRICAL, PLUMBING, CLEANING, INTERNET, OTHER
-- ComplaintStatus enum: OPEN, IN_PROGRESS, RESOLVED
INSERT INTO complaints (id, tenant_id, property_id, category, title, description, status, created_at, resolved_at, remarks) VALUES
(1, 2, 1, 'PLUMBING', 'Bathroom tap leaking in Room 101', 'Continuous water dripping from the washbasin faucet since yesterday morning.', 'OPEN', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL, NULL),
(2, 6, 1, 'ELECTRICAL', 'Air conditioner cooling issue', 'AC is blowing room-temperature air and not cooling properly in room 102.', 'IN_PROGRESS', CURRENT_TIMESTAMP - INTERVAL '3 days', NULL, 'Technician dispatched for refrigerant inspection'),
(3, 7, 1, 'INTERNET', 'Slow Wi-Fi speed on 2nd floor', 'Wi-Fi router on 2nd floor loses connection frequently during evening hours.', 'RESOLVED', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '2 days', 'Router rebooted and 5GHz band channel reconfigured');

-- STEP 9: NOTICES (Belongs to properties)
INSERT INTO notices (id, property_id, title, content, created_at, created_by) VALUES
(1, 1, 'Water Tank Cleaning Scheduled for Saturday', 'Please note that the main overhead water tank cleaning is scheduled this Saturday between 10:00 AM to 1:00 PM. Water supply will be temporarily paused. Please store adequate water in advance.', CURRENT_TIMESTAMP - INTERVAL '2 days', 'Krish Patel'),
(2, 1, 'Wi-Fi Router Firmware Upgrade', 'High-speed fiber connectivity has been upgraded across all floors. The new Wi-Fi credentials are available at the front desk or from the resident supervisor.', CURRENT_TIMESTAMP - INTERVAL '5 days', 'Krish Patel'),
(3, 1, 'Monthly Rent Reminder', 'Friendly reminder to all tenants: Monthly rent invoices are generated automatically on your check-in anniversary date. Please clear all pending dues within 5 days of invoice date.', CURRENT_TIMESTAMP - INTERVAL '10 days', 'Krish Patel');

-- STEP 10: SYNCHRONIZE IDENTITY SEQUENCES
-- In PostgreSQL with IDENTITY columns, manual ID inserts must advance the sequence to prevent primary key collisions on new UI inserts.
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval(pg_get_serial_sequence('properties', 'id'), COALESCE((SELECT MAX(id) FROM properties), 1));
SELECT setval(pg_get_serial_sequence('rooms', 'id'), COALESCE((SELECT MAX(id) FROM rooms), 1));
SELECT setval(pg_get_serial_sequence('beds', 'id'), COALESCE((SELECT MAX(id) FROM beds), 1));
SELECT setval(pg_get_serial_sequence('allocations', 'id'), COALESCE((SELECT MAX(id) FROM allocations), 1));
SELECT setval(pg_get_serial_sequence('invoices', 'id'), COALESCE((SELECT MAX(id) FROM invoices), 1));
SELECT setval(pg_get_serial_sequence('payments', 'id'), COALESCE((SELECT MAX(id) FROM payments), 1));
SELECT setval(pg_get_serial_sequence('complaints', 'id'), COALESCE((SELECT MAX(id) FROM complaints), 1));
SELECT setval(pg_get_serial_sequence('notices', 'id'), COALESCE((SELECT MAX(id) FROM notices), 1));
