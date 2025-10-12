import React from 'react';
import AuthForm from './form';
import useAuthLogic from './useAuthLogic.jsx';

const Auth = () => {
  const {
    isLogin,
    loading,
    error,
    formData,
    handleChange,
    handleSubmit,
    toggleMode
  } = useAuthLogic();

  return (
    <AuthForm
      isLogin={isLogin}
      loading={loading}
      error={error}
      formData={formData}
      onSubmit={handleSubmit}
      onChange={handleChange}
      onToggleMode={toggleMode}
    />
  );
};

export default Auth;
