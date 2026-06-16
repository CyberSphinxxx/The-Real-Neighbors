import { setDoc, getDoc, updateDoc } from '../lib/firestore';
import type { User } from '../types';
import { auth } from '../lib/firebase';

/**
 * Manually seeds an admin user and their allowed email.
 * This should ONLY be run once manually from the browser console by an authorized developer,
 * while the developer is authenticated into the Firebase project.
 * 
 * Instructions:
 * 1. Import this file temporarily somewhere in your code or expose it to `window`.
 * 2. Log in using Firebase Auth with the target admin email.
 * 3. Call seedAdminUser('admin@example.com').
 */
export const seedAdminUser = async (email: string) => {
  if (!auth.currentUser) {
    console.error("No authenticated user found. You must log in first.");
    return;
  }

  const uid = auth.currentUser.uid;

  try {
    // 1. Whitelist the email
    await setDoc('allowedEmails', [email], {
      email,
      addedAt: Date.now(),
      addedBy: 'system'
    });
    console.log(`Successfully whitelisted email: ${email}`);

    // 2. Set the user document as admin
    const existingUser = await getDoc<User>('users', [uid]);
    
    if (existingUser) {
      await updateDoc<User>('users', [uid], { role: 'admin' });
      console.log(`Successfully updated existing user ${uid} to admin role.`);
    } else {
      const namePrefix = email.split('@')[0];
      const newUserProfile: User = {
        id: uid,
        displayName: namePrefix,
        email: email,
        role: 'admin',
        joinedAt: Date.now(),
        accentColor: '#6366f1',
      };
      await setDoc<User>('users', [uid], newUserProfile);
      console.log(`Successfully created new admin user profile for ${uid}.`);
    }

    console.log("Admin seeding complete.");
  } catch (error) {
    console.error("Failed to seed admin:", error);
  }
};

// Optional: expose to window for easy browser console execution during setup
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).seedAdminUser = seedAdminUser;
}
