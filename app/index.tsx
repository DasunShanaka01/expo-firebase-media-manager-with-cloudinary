import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../FirebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { router } from 'expo-router';

const Index = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async () => {
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in:', user);

      if (user) router.replace('/(tabs)');
    } catch (error) {
      console.error('Error signing in:', error);
      if (error instanceof Error) {
        alert('Error signing in: ' + error.message);
      } else {
        alert('Error signing in: An unknown error occurred');
      }
    }
  };

  const signUp = async () => {
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    try {
      const user = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User signed up:', user);

      if (user) router.replace('/(tabs)');
    } catch (error) {
      console.error('Error signing up:', error);
      if (error instanceof Error) {
        alert('Error signing up: ' + error.message);
      } else {
        alert('Error signing up: An unknown error occurred');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={signIn}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={signUp}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default Index;
