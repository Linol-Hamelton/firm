import { useForm } from 'react-hook-form';
import { firmResolver } from '../lib/firmResolver';
import { registerSchema, type RegisterInput } from '../schemas/user.schema';
import './forms.css';

/**
 * Basic Registration Form
 * Demonstrates FIRM validation with React Hook Form
 */
export function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegisterInput>({
    resolver: firmResolver(registerSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: RegisterInput) => {
    console.log('Form data:', data);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    alert('Registration successful!');
    reset();
  };

  return (
    <div className="form-container">
      <h2>User Registration</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="form">
        <div className="form-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            {...register('username')}
            className={errors.username ? 'error' : ''}
          />
          {errors.username && (
            <span className="error-message">{errors.username.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={errors.email ? 'error' : ''}
          />
          {errors.email && (
            <span className="error-message">{errors.email.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className={errors.password ? 'error' : ''}
          />
          {errors.password && (
            <span className="error-message">{errors.password.message}</span>
          )}
          <small>Minimum 8 characters</small>
        </div>

        <div className="form-field">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            className={errors.confirmPassword ? 'error' : ''}
          />
          {errors.confirmPassword && (
            <span className="error-message">
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="age">Age</label>
          <input
            id="age"
            type="number"
            {...register('age')}
            className={errors.age ? 'error' : ''}
          />
          {errors.age && (
            <span className="error-message">{errors.age.message}</span>
          )}
          <small>Must be 18 or older</small>
        </div>

        <div className="form-field checkbox">
          <label>
            <input type="checkbox" {...register('acceptTerms')} />
            <span>I accept the terms and conditions</span>
          </label>
          {errors.acceptTerms && (
            <span className="error-message">{errors.acceptTerms.message}</span>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className="submit-button">
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}
