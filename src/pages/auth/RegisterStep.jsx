import React, { useState } from 'react'
import LoginScreen from './loginScreen';
import CompanyAskStep from './CompanyAskStep';
import RegisterScreen from './registerScreen';
import { Helmet } from "react-helmet-async";

const RegisterStep = () => {
    const [step, setStep] = useState(1);
    const [accounts, setAccounts] = useState([]);
    const [loginCredentials, setLoginCredentials] = useState(null);
    const [loginType, setLoginType] = useState(null);

  return (
    <>
      <Helmet>
        <title>Create Account | Dyzo</title>
        <meta
          name="description"
          content="Register your Dyzo account to manage tasks, track time, and automate workflows easily. Start your free trial today."
        />
        <meta property="og:title" content="Create Account | Dyzo" />
        <meta property="og:url" content="https://dyzo.ai/register" />
        <link rel="canonical" href="https://dyzo.ai/register" />
      </Helmet>
      {step === 1 && (
          <RegisterScreen handleUpdateStepCount={(count) => setStep(count)} setAccounts={setAccounts} setLoginCredentials={setLoginCredentials} setLoginType={setLoginType} />
      )}

      {step === 2 && (
          <CompanyAskStep accounts={accounts} loginCredentials={loginCredentials} loginType={loginType} />
      )}

    </>
  )
}

export default RegisterStep;