# Course Versioning System - Guide for Coaches

## Overview

The NexSkill LMS now includes a **Course Versioning System** that ensures course updates are properly reviewed before being shown to students. This maintains quality and prevents accidental changes from affecting active students.

## How It Works

### For Coaches: Creating Course Updates

1. **Edit Your Course**
   - Navigate to your course in the Coach Dashboard
   - Make changes to modules, lessons, or quizzes
   - Add new content as needed

2. **Submit for Review**
   - When ready to publish changes, click **"Submit for Review"**
   - Provide a description of what you changed
   - Select the update type:
     - **Content Update**: Adding/modifying lessons or quizzes
     - **Price Change**: Updating the course price
     - **Metadata Update**: Changing title, description, or other details
     - **Major Revision**: Significant course overhaul

3. **Wait for Admin Approval**
   - Your changes enter "Pending Review" status
   - Admins will review your changes
   - You'll be notified when approved or rejected

### What Happens During Review

- **Students continue to see the last approved version** of the course
- Your pending changes are **not visible** to students
- You can still edit your pending changes before approval
- You can cancel the pending update if needed

### Admin Review Process

1. **Admin Reviews** your changes
2. **If Approved**:
   - Changes are merged into the published course
   - Students immediately see the updated version
   - You receive a notification with any review notes

3. **If Rejected**:
   - Changes are not applied
   - You receive feedback explaining why
   - You can make corrections and resubmit

## Best Practices

### When Submitting Updates

✅ **DO:**
- Provide clear, detailed descriptions of changes
- Test your content thoroughly before submitting
- Use appropriate priority levels (normal, urgent)
- Wait for approval before promising new content to students

❌ **DON'T:**
- Submit incomplete or broken content
- Mark everything as "urgent" (use for true emergencies)
- Submit multiple overlapping updates (wait for approval first)

### Update Types Guide

| Type | Use For | Example |
|------|---------|---------|
| **Content Update** | Adding/modifying lessons, quizzes, modules | "Added 3 new React hooks lessons" |
| **Price Change** | Updating course price | "Increased price from $49 to $79" |
| **Metadata Update** | Title, description, category changes | "Updated course description for clarity" |
| **Major Revision** | Complete course overhaul | "Complete rewrite with new curriculum" |

## Version History

You can view all versions of your course in the Coach Dashboard:
- **Published**: Currently live version
- **Pending Review**: Awaiting admin approval
- **Approved**: Previously published versions
- **Rejected**: Changes that were not approved

## Emergency Updates

For urgent fixes (broken videos, incorrect information):
1. Mark the update as **"Urgent"** priority
2. Contact an admin directly via message
3. Explain the urgency in your change description

## FAQ

**Q: How long does approval take?**
A: Typically 24-48 hours. Urgent updates are prioritized.

**Q: Can students see my changes during review?**
A: No, students only see the last approved version.

**Q: What if my update is rejected?**
A: You'll receive feedback. Make the requested changes and resubmit.

**Q: Can I edit a pending update?**
A: Yes, while it's still in "Pending" status, you can make changes.

**Q: What happens to student progress when I update?**
A: Student progress is preserved. The system merges your changes without affecting existing progress data.

---

## Technical Details

### Database Tables

- `course_versions`: Tracks each version of a course
- `pending_course_updates`: Stores pending update requests
- `pending_module_updates`: Module-level changes
- `pending_content_item_updates`: Lesson/quiz-level changes

### Key Functions

- `submit_course_update()`: Creates a new pending update
- `approve_course_update()`: Admin approves and applies changes
- `reject_course_update()`: Admin rejects with feedback
- `get_published_course_version()`: Gets the current published version ID

### RLS Policies

- **Coaches**: Can view/manage their own courses and updates
- **Admins**: Full access to all courses and updates
- **Students**: Can only view published versions

---

**Need Help?** Contact the admin team or check the admin panel for update status.
