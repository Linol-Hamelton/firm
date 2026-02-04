import { useForm, useWatch } from 'react-hook-form';
import { firmResolver } from '../lib/firmResolver';
import { contactSchema, type ContactInput } from '../schemas/user.schema';
import './forms.css';

/**
 * Dynamic Form with Conditional Fields
 * Demonstrates conditional validation based on user selections
 */
export function DynamicForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<ContactInput>({
    resolver: firmResolver(contactSchema),
    defaultValues: {
      contactMethod: 'email',
    },
  });

  // Watch the contactMethod field to show/hide conditional fields
  const contactMethod = useWatch({
    control,
    name: 'contactMethod',
  });

  const onSubmit = async (data: ContactInput) => {
    console.log('Contact data:', data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert('Contact preferences saved!');
  };

  return (
    <div className="form-container">
      <h2>Contact Preferences</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="form">
        <div className="form-field">
          <label htmlFor="contactMethod">Preferred Contact Method</label>
          <select
            id="contactMethod"
            {...register('contactMethod')}
            className={errors.contactMethod ? 'error' : ''}
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="mail">Postal Mail</option>
          </select>
          {errors.contactMethod && (
            <span className="error-message">{errors.contactMethod.message}</span>
          )}
        </div>

        {/* Conditional Email Field */}
        {contactMethod === 'email' && (
          <div className="form-field highlight">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={errors.email ? 'error' : ''}
              placeholder="your@email.com"
            />
            {errors.email && (
              <span className="error-message">{errors.email.message}</span>
            )}
          </div>
        )}

        {/* Conditional Phone Field */}
        {contactMethod === 'phone' && (
          <div className="form-field highlight">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              className={errors.phone ? 'error' : ''}
              placeholder="+1 (555) 123-4567"
            />
            {errors.phone && (
              <span className="error-message">{errors.phone.message}</span>
            )}
          </div>
        )}

        {/* Conditional Address Fields */}
        {contactMethod === 'mail' && (
          <fieldset className="form-section highlight">
            <legend>Mailing Address</legend>

            <div className="form-field">
              <label htmlFor="street">Street Address</label>
              <input
                id="street"
                type="text"
                {...register('mailingAddress.street')}
                className={errors.mailingAddress?.street ? 'error' : ''}
              />
              {errors.mailingAddress?.street && (
                <span className="error-message">
                  {errors.mailingAddress.street.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="city">City</label>
              <input
                id="city"
                type="text"
                {...register('mailingAddress.city')}
                className={errors.mailingAddress?.city ? 'error' : ''}
              />
              {errors.mailingAddress?.city && (
                <span className="error-message">
                  {errors.mailingAddress.city.message}
                </span>
              )}
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="state">State</label>
                <input
                  id="state"
                  type="text"
                  {...register('mailingAddress.state')}
                  className={errors.mailingAddress?.state ? 'error' : ''}
                  placeholder="NY"
                  maxLength={2}
                />
                {errors.mailingAddress?.state && (
                  <span className="error-message">
                    {errors.mailingAddress.state.message}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="zipCode">ZIP Code</label>
                <input
                  id="zipCode"
                  type="text"
                  {...register('mailingAddress.zipCode')}
                  className={errors.mailingAddress?.zipCode ? 'error' : ''}
                  placeholder="12345"
                />
                {errors.mailingAddress?.zipCode && (
                  <span className="error-message">
                    {errors.mailingAddress.zipCode.message}
                  </span>
                )}
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="country">Country</label>
              <input
                id="country"
                type="text"
                {...register('mailingAddress.country')}
                className={errors.mailingAddress?.country ? 'error' : ''}
                defaultValue="US"
              />
              {errors.mailingAddress?.country && (
                <span className="error-message">
                  {errors.mailingAddress.country.message}
                </span>
              )}
            </div>
          </fieldset>
        )}

        <button type="submit" disabled={isSubmitting} className="submit-button">
          {isSubmitting ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
}
