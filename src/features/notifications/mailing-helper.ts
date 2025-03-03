export function registrationEmail(code: string) {
  return ` <h1>Thank for your registration</h1>
         <p>To finish registration please follow the link below:<br>
            <a href='https://some-front.com/confirm-registration?code=${code}'>complete registration</a>
        </p>`;
}

export function passwordRecoveryEmail(code: string) {
  return `<h1>Password recovery</h1>
  <p>To finish password recovery please follow the link below:
      <a href='https://somesite.com/password-recovery?recoveryCode=${code}'>recovery password</a>
  </p>`;
}
