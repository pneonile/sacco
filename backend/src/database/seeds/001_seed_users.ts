/**
 * Seed: Initial Users
 * 
 * This seed creates the initial users for the system including an admin user,
 * a staff user, and a sample member. These users provide the foundation for
 * testing and initial system setup.
 */
import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

// Pre-hashed version of 'password123' for consistency
const hashedPassword = '$2a$10$66dEFB0ECnOZRiiYWrtVN.LbBb/Oj/SoKJV9PJcVc2tdL0Ywi/BmW';

export async function seed(knex: Knex): Promise<void> {
  // Delete existing entries (if any)
  await knex('users').del();

  // Insert seed users
  await knex('users').insert([
    {
      id: uuidv4(),
      email: 'admin@kawempesacco.com',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      phone_number: '+256701234567',
      id_number: 'CM123456789',
      address: 'Kawempe, Kampala',
      join_date: '2020-01-15',
      status: 'active',
      password: hashedPassword,
      email_verified: true,
      phone_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      email: 'staff@kawempesacco.com',
      first_name: 'Grace',
      last_name: 'Auma',
      role: 'staff',
      phone_number: '+256703456789',
      id_number: 'CM567891234',
      address: 'Kawempe, Kampala',
      join_date: '2022-05-10',
      status: 'active',
      password: hashedPassword,
      email_verified: true,
      phone_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      email: 'john.doe@gmail.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'member',
      member_number: 'KS001',
      phone_number: '+256702345678',
      id_number: 'CM987654321',
      address: 'Kawempe, Kampala',
      employer_name: 'Uganda Revenue Authority',
      join_date: '2021-03-20',
      status: 'active',
      password: hashedPassword,
      email_verified: true,
      phone_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
  
  console.log('Seed users created successfully');
}
