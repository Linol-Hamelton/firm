import { useForm } from 'react-hook-form';
import { firmResolver } from '../lib/firmResolver';
import { profileSchema, type ProfileInput } from '../schemas/user.schema';
import './forms.css';

/**
 * Profile Update Form
 * Demonstrates optional fields and nested objects
 */
export function ProfileForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileInput>({
    resolver: firmResolver(profileSchema),
    defaultValues: {
      displayName: 'John Doe',
      bio: 'Software developer',
      website: 'https://example.com',
      location: 'New York, NY',
      notifications: {
        email: true,
        push: false,
        sms: false,
      },
    },
  });

  const onSubmit = async (data: ProfileInput) => {
    console.log('Profile data:', data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert('Profile updated successfully!');
  };

  return (
    <div className="form-container">
      <h2>Update Profile</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="form">
        <div className="form-field">
          <label htmlFor="displayName">Display Name</label>
          <input
            id="displayName"
            type="text"
            {...register('displayName')}
            className={errors.displayName ? 'error' : ''}
          />
          {errors.displayName && (
            <span className="error-message">{errors.displayName.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            rows={4}
            {...register('bio')}
            className={errors.bio ? 'error' : ''}
            placeholder="Tell us about yourself..."
          />
          {errors.bio && (
            <span className="error-message">{errors.bio.message}</span>
          )}
          <small>Maximum 500 characters</small>
        </div>

        <div className="form-field">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            type="url"
            {...register('website')}
            className={errors.website ? 'error' : ''}
            placeholder="https://example.com"
          />
          {errors.website && (
            <span className="error-message">{errors.website.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="avatar">Avatar URL</label>
          <input
            id="avatar"
            type="url"
            {...register('avatar')}
            className={errors.avatar ? 'error' : ''}
            placeholder="https://example.com/avatar.jpg"
          />
          {errors.avatar && (
            <span className="error-message">{errors.avatar.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            {...register('location')}
            className={errors.location ? 'error' : ''}
            placeholder="City, State"
          />
          {errors.location && (
            <span className="error-message">{errors.location.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="birthdate">Birthdate</label>
          <input
            id="birthdate"
            type="date"
            {...register('birthdate')}
            className={errors.birthdate ? 'error' : ''}
          />
          {errors.birthdate && (
            <span className="error-message">{errors.birthdate.message}</span>
          )}
        </div>

        <fieldset className="form-section">
          <legend>Notification Preferences</legend>

          <div className="form-field checkbox">
            <label>
              <input type="checkbox" {...register('notifications.email')} />
              <span>Email notifications</span>
            </label>
          </div>

          <div className="form-field checkbox">
            <label>
              <input type="checkbox" {...register('notifications.push')} />
              <span>Push notifications</span>
            </label>
          </div>

          <div className="form-field checkbox">
            <label>
              <input type="checkbox" {...register('notifications.sms')} />
              <span>SMS notifications</span>
            </label>
          </div>
        </fieldset>

        <div className="button-group">
          <button
            type="button"
            onClick={() => reset()}
            className="secondary-button"
            disabled={!isDirty || isSubmitting}
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
