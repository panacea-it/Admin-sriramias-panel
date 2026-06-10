export function validateLoginFields({ email, password }) {
  const errors = {}

  const trimmedEmail = email?.trim() ?? ''
  const trimmedPassword = password?.trim() ?? ''

  if (!trimmedEmail) {
    errors.email = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
    errors.email = 'Invalid email format'
  }

  if (!trimmedPassword) {
    errors.password = 'Password is required'
  } else if (trimmedPassword.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }

  return errors
}

export function firstLoginValidationMessage(errors) {
  return errors.email || errors.password || null
}
