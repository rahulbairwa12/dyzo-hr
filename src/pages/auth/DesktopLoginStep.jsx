import React, { useState } from 'react'
import CompanyAskStep from './CompanyAskStep';
import DesktopLoginScreen from './DesktopLoginScreen';
import DesktopCompanyAskStep from './DesktopCompanyAskStep';

const DesktopLoginStep = () => {
    const [step, setStep] = useState(1);
    const [accounts, setAccounts] = useState([]);
    const [loginCredentials, setLoginCredentials] = useState(null);
    const [loginType, setLoginType] = useState(null);

  return (
    <>
      {step === 1 && (
          <DesktopLoginScreen handleUpdateStepCount={(count) => setStep(count)} setAccounts={setAccounts} setLoginCredentials={setLoginCredentials} setLoginType={setLoginType} />
      )}

      {step === 2 && (
          <DesktopCompanyAskStep accounts={accounts} loginCredentials={loginCredentials} loginType={loginType} />
      )}

    </>
  )
}

export default DesktopLoginStep;