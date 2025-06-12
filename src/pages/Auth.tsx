
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from "@/components/ui/checkbox";
import Logo from '@/components/Logo';

const Auth = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add new state to track if a user is newly registered
  const {
    setIsNewUser
  } = useAuth();
  
  const toggleMode = () => {
    setIsSignIn(!isSignIn);
    setAuthError(null);
  };
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };
  
  const handleSignUp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);
    
    if (!username.trim()) {
      setAuthError("Username is required");
      setIsSubmitting(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setAuthError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }
    
    if (!termsAccepted) {
      setAuthError("You must accept the Terms of Service");
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Sign up the user
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            phone: phoneNumber // Store phone in auth metadata for handle_new_user function
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        // Set the new user flag in auth context
        setIsNewUser(true);
        toast.success("Account created successfully!");
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setAuthError(error.message || "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        throw error;
      }
      toast.success("Signed in successfully!");
    } catch (error: any) {
      console.error('Sign in error:', error);
      setAuthError(error.message || "Failed to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: 'google'
      });
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setAuthError(error.message || "Failed to sign in with Google");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return <div className="container max-w-md mx-auto px-4 py-12">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Welcome to <Logo linkTo={false} size="lg" className="inline" />
          </CardTitle>
          <CardDescription className="text-center">Find your perfect dining experience based on your preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Button variant={isSignIn ? "default" : "outline"} className="w-full" onClick={() => setIsSignIn(true)}>
              Login
            </Button>
            <Button variant={!isSignIn ? "default" : "outline"} className="w-full" onClick={() => setIsSignIn(false)}>
              Sign Up
            </Button>
          </div>

          {authError && <div className="rounded-md bg-red-100 p-4 mb-4">
              <p className="text-sm text-red-800">{authError}</p>
            </div>}

          <form className="space-y-4">
            {!isSignIn && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  placeholder="Enter your username" 
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  disabled={isSubmitting} 
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                placeholder="youremail@example.com" 
                type="email" 
                value={email} 
                onChange={handleEmailChange} 
                disabled={isSubmitting} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                placeholder="••••••••" 
                type="password" 
                value={password} 
                onChange={handlePasswordChange} 
                disabled={isSubmitting} 
              />
              {isSignIn && <div className="text-right">
                  <a href="#" className="text-sm text-muted-foreground hover:underline">
                    Forgot password?
                  </a>
                </div>}
            </div>

            {!isSignIn && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    placeholder="••••••••" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    disabled={isSubmitting} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                  <Input 
                    id="phoneNumber" 
                    placeholder="Enter your phone number" 
                    type="tel" 
                    value={phoneNumber} 
                    onChange={e => setPhoneNumber(e.target.value)} 
                    disabled={isSubmitting} 
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted} 
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)} 
                  />
                  <label 
                    htmlFor="terms" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the Terms of Service
                  </label>
                </div>
              </>
            )}

            <Button 
              className="w-full" 
              disabled={isSubmitting || (!isSignIn && !termsAccepted)} 
              onClick={isSignIn ? handleSignIn : handleSignUp}
            >
              {isSubmitting ? isSignIn ? "Signing In..." : "Signing Up..." : isSignIn ? "Sign In" : "Sign Up"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
              {isSignIn ? "Sign in with Google" : "Sign up with Google"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>;
};

export default Auth;
