const { db } = require('../lib/db');
const { users } = require('../lib/schema/users');
const { roles } = require('../lib/schema/roles');
const { creditApplication } = require('../lib/schema/creditApplication');
const { applicationStatus } = require('../lib/schema/applicationStatus');
const { applicationSla } = require('../lib/schema/applicationSLA');
const bcrypt = require('bcrypt');
const { sql, eq, inArray } = require('drizzle-orm');

async function main() {
  console.log('🌱 Starting seed...');

  try {
    // Clear existing data (in reverse order of dependencies)
    console.log('🗑️  Clearing existing data...');
    await db.delete(applicationSla);
    await db.delete(applicationStatus);
    await db.delete(creditApplication);
    await db.delete(users);
    await db.delete(roles);

    // Seed Roles
    console.log('📝 Seeding roles...');
    await db.insert(roles).values([
      { id: 1, namaRole: 'Admin', deskripsi: 'Administrator sistem' },
      { id: 2, namaRole: 'Agent', deskripsi: 'Agent kredit' },
      { id: 3, namaRole: 'Nasabah', deskripsi: 'Nasabah peminjam' },
    ]);
    const rolesData = await db.select().from(roles);
    console.log(`✅ Created ${rolesData.length} roles`);

    // Seed Users (with hashed passwords)
    console.log('👥 Seeding users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const usersData = [
      {
        id: 'e5f2d53a-c632-4c4e-82c7-83cabf004f62',
        name: 'Nadip',
        email: 'nadifaryastia@gmail.com',
        password: hashedPassword,
        noPhone: '0',
        agentCode: 'AG-L94LT6',
        nasabahCode: null,
        roleId: 1,
        createdAt: new Date('2026-01-12T11:57:15.628Z'),
        updatedAt: new Date('2026-01-12T11:57:15.628Z'),
      },
      {
        id: '7170cc5b-633a-4781-8be1-ef5312237333',
        name: 'Admin',
        email: 'admin@gmail.com',
        password: hashedPassword,
        noPhone: '0',
        agentCode: 'AG-NZBB12',
        nasabahCode: null,
        roleId: 1,
        createdAt: new Date('2026-01-12T11:59:20.911Z'),
        updatedAt: new Date('2026-01-12T11:59:20.911Z'),
      },
      {
        id: '9ebf66d7-6059-4141-bee4-47054deb6075',
        name: 'Sulthan1',
        email: 'sm.syathir@gmail.com',
        password: hashedPassword,
        noPhone: '081210624980',
        agentCode: null,
        nasabahCode: 'WDAWDA',
        roleId: 3,
        createdAt: new Date('2026-01-12T12:05:04.829Z'),
        updatedAt: new Date('2026-01-12T12:05:23.453Z'),
      },
      {
        id: '1780c48c-5ddb-4c61-aeb0-60e0962c048d',
        name: 'Firas1',
        email: 'sm.michiealexandra@gmail.com',
        password: hashedPassword,
        noPhone: '081210624981',
        agentCode: 'AG-F5XMWY',
        nasabahCode: null,
        roleId: 2,
        createdAt: new Date('2026-01-12T12:06:33.727Z'),
        updatedAt: new Date('2026-01-12T12:06:51.616Z'),
      },
    ];

    await db.insert(users).values(usersData);
    const createdUsers = await db.select().from(users);
    console.log(
      `✅ Created ${createdUsers.length} users (password for all: password123)`
    );

    // Seed Credit Applications
    console.log('💳 Seeding credit applications...');
    const applicationsData = [
      {
        id: 1,
        kodePengajuan: 'L-0001',
        nik: '3275125009750002',
        namaLengkap: 'Nadip',
        alamat: 'Depok',
        tempatLahir: 'Depok',
        tanggalLahir: new Date('2026-01-12'),
        email: 'nadifaryastia@gmail.com',
        jenisKredit: 'MULTIGUNA',
        plafond: 1000000.0,
        jaminan: 'BPKB',
        userId: 'e5f2d53a-c632-4c4e-82c7-83cabf004f62',
        createdAt: new Date('2026-01-12T11:58:31.044Z'),
        updatedAt: new Date('2026-01-12T11:58:31.044Z'),
      },
      {
        id: 2,
        kodePengajuan: 'L-0002',
        nik: '1111111111111112',
        namaLengkap: 'Sulthan',
        alamat: 'Depok',
        tempatLahir: 'Depok',
        tanggalLahir: new Date('2008-02-23'),
        email: 'sm.syathir@gmail.com',
        jenisKredit: 'KREDIT_PRODUKTIF',
        plafond: 100000000.0,
        jaminan: 'SK_PEGAWAI',
        userId: '9ebf66d7-6059-4141-bee4-47054deb6075',
        createdAt: new Date('2026-01-12T12:05:44.839Z'),
        updatedAt: new Date('2026-01-12T12:05:44.839Z'),
      },
      {
        id: 3,
        kodePengajuan: 'L-0003',
        nik: '1111111111111113',
        namaLengkap: 'Firas',
        alamat: 'Depok',
        tempatLahir: 'Depok',
        tanggalLahir: new Date('2007-08-23'),
        email: 'sm.michiealexandra@gmail.com',
        jenisKredit: 'KPR',
        plafond: 100000000.0,
        jaminan: 'SK_PEGAWAI',
        userId: '1780c48c-5ddb-4c61-aeb0-60e0962c048d',
        createdAt: new Date('2026-01-12T12:07:11.040Z'),
        updatedAt: new Date('2026-01-12T12:07:11.040Z'),
      },
    ];

    await db.insert(creditApplication).values(applicationsData);
    const createdApplications = await db.select().from(creditApplication);
    console.log(`✅ Created ${createdApplications.length} credit applications`);

    // Seed Application Status
    console.log('📊 Seeding application statuses...');
    const statusesData = [
      {
        id: 1,
        applicationId: 1,
        status: 'DIAJUKAN',
        catatan: 'Pengajuan kredit dibuat',
        createdAt: new Date('2026-01-12T11:58:31.044Z'),
        changedBy: 'e5f2d53a-c632-4c4e-82c7-83cabf004f62',
      },
      {
        id: 2,
        applicationId: 2,
        status: 'DIAJUKAN',
        catatan: 'Pengajuan kredit dibuat',
        createdAt: new Date('2026-01-12T12:05:44.839Z'),
        changedBy: '9ebf66d7-6059-4141-bee4-47054deb6075',
      },
      {
        id: 3,
        applicationId: 3,
        status: 'DIAJUKAN',
        catatan: 'Pengajuan kredit dibuat',
        createdAt: new Date('2026-01-12T12:07:11.040Z'),
        changedBy: '1780c48c-5ddb-4c61-aeb0-60e0962c048d',
      },
      {
        id: 4,
        applicationId: 3,
        status: 'DITOLAK',
        catatan: 'Status diubah menjadi DITOLAK',
        createdAt: new Date('2026-01-12T12:08:18.816Z'),
        changedBy: '7170cc5b-633a-4781-8be1-ef5312237333',
      },
      {
        id: 5,
        applicationId: 2,
        status: 'DITERIMA',
        catatan: 'Status diubah menjadi DITERIMA',
        createdAt: new Date('2026-01-12T12:08:21.070Z'),
        changedBy: '7170cc5b-633a-4781-8be1-ef5312237333',
      },
      {
        id: 6,
        applicationId: 1,
        status: 'DIPROSES',
        catatan: 'Status diubah menjadi DIPROSES',
        createdAt: new Date('2026-01-12T12:08:23.512Z'),
        changedBy: '7170cc5b-633a-4781-8be1-ef5312237333',
      },
      {
        id: 7,
        applicationId: 3,
        status: 'DITOLAK',
        catatan: 'Status diubah menjadi DITOLAK',
        createdAt: new Date('2026-01-12T12:08:28.317Z'),
        changedBy: '7170cc5b-633a-4781-8be1-ef5312237333',
      },
    ];

    await db.insert(applicationStatus).values(statusesData);
    const createdStatuses = await db.select().from(applicationStatus);
    console.log(`✅ Created ${createdStatuses.length} application statuses`);

    console.log('✨ Seed completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Roles: ${rolesData.length}`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Credit Applications: ${createdApplications.length}`);
    console.log(`   - Application Statuses: ${createdStatuses.length}`);
    console.log('\n🔑 Login credentials:');
    console.log('   Email: admin@gmail.com');
    console.log('   Password: password123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .then(() => {
    console.log('✅ Seeding finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });

module.exports = { main };