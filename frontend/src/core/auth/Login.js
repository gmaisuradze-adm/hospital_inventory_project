import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useAuth } from './AuthContext';
import hospitalLogo from '../../assets/images/hospital-logo.svg';

const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

const Login = () => {
  const { login, error } = useAuth();
  const [submitError, setSubmitError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting }) => {
    setSubmitError(null);
    const success = await login(values);
    if (success) {
      navigate('/');
    }
    setSubmitting(false);
  };

  return (
    <div className="page page-center">
      <div className="container container-tight py-4">
        <div className="text-center mb-4">
          <img src={hospitalLogo} alt="Hospital IT" className="navbar-brand-image" />
          <h1>Hospital IT Management System</h1>
        </div>
        <div className="card card-md">
          <div className="card-body">
            <h2 className="h2 text-center mb-4">Login to your account</h2>
            
            {(error || submitError) && (
              <div className="alert alert-danger" role="alert">
                {error || submitError}
              </div>
            )}
            
            <Formik
              initialValues={{ username: '', password: '' }}
              validationSchema={LoginSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form>
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <Field 
                      name="username" 
                      className={`form-control ${errors.username && touched.username ? 'is-invalid' : ''}`} 
                      placeholder="Your username"
                    />
                    {errors.username && touched.username && (
                      <div className="invalid-feedback">{errors.username}</div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">
                      Password
                      <span className="form-label-description">
                        <a href="#forgot-password">I forgot password</a>
                      </span>
                    </label>
                    <Field
                      name="password"
                      type="password"
                      className={`form-control ${errors.password && touched.password ? 'is-invalid' : ''}`}
                      placeholder="Your password"
                    />
                    {errors.password && touched.password && (
                      <div className="invalid-feedback">{errors.password}</div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-check">
                      <Field type="checkbox" name="remember" className="form-check-input" />
                      <span className="form-check-label">Remember me on this device</span>
                    </label>
                  </div>
                  
                  <div className="form-footer">
                    <button 
                      type="submit" 
                      className="btn btn-primary w-100"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Signing in...
                        </>
                      ) : 'Sign in'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
        <div className="text-center text-muted mt-3">
          Don't have account yet? <a href="#contact-admin">Contact administrator</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
