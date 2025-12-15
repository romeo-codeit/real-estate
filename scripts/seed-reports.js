// Seed sample reports and moderation data for testing
import { supabase } from '../services/supabase/supabase';

async function seedReports() {
  try {
    console.log('Seeding sample reports and moderation data...');

    // Sample reports
    const sampleReports = [
      {
        reporter_id: 'sample-user-1', // This would be a real user ID
        reported_user_id: 'sample-user-2',
        content_type: 'property',
        content_id: 'sample-property-1',
        reason: 'inappropriate_content',
        description: 'This property listing contains inappropriate images.',
        status: 'pending'
      },
      {
        reporter_id: 'sample-user-3',
        reported_user_id: 'sample-user-4',
        content_type: 'comment',
        content_id: 'sample-comment-1',
        reason: 'harassment',
        description: 'User is harassing other users in comments.',
        status: 'investigating'
      },
      {
        reporter_id: 'sample-user-5',
        reported_user_id: 'sample-user-6',
        content_type: 'user_profile',
        content_id: 'sample-profile-1',
        reason: 'spam',
        description: 'User profile appears to be spam/fake account.',
        status: 'resolved'
      }
    ];

    // Sample moderation queue items
    const sampleModerationItems = [
      {
        content_type: 'property',
        content_id: 'sample-property-2',
        flag_reason: 'user_report',
        severity: 'medium',
        status: 'pending'
      },
      {
        content_type: 'crypto',
        content_id: 'sample-crypto-1',
        flag_reason: 'automated',
        severity: 'high',
        status: 'reviewing'
      },
      {
        content_type: 'investment',
        content_id: 'sample-investment-1',
        flag_reason: 'admin_review',
        severity: 'critical',
        status: 'pending'
      }
    ];

    console.log('Note: This script creates sample data structure.');
    console.log('In a real implementation, you would insert actual user IDs and content IDs.');
    console.log('Sample reports data structure:', sampleReports);
    console.log('Sample moderation data structure:', sampleModerationItems);

    console.log('Reports and moderation seeding completed (sample data shown above).');

  } catch (error) {
    console.error('Error seeding reports:', error);
  }
}

// Run the seeding function
seedReports();