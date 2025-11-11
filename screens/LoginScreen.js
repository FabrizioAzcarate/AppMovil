import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { validateUser } from '../database/db';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const userSession = await AsyncStorage.getItem('user');
      if (userSession) {
        const user = JSON.parse(userSession);
        navigateByRole(user.role);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateByRole = (role) => {
    navigation.replace(role === 'admin' ? 'Admin' : 'Movie');
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor, complete todos los campos.');
      return;
    }

    try {
      const user = await validateUser(username, password);
      if (user) {
        await AsyncStorage.setItem('user', JSON.stringify(user));
        navigateByRole(user.role);
      } else {
        Alert.alert('Error', 'Ha ingresado credenciales inválidas.');
      }
    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert('Error', 'Hubo un error al intentar iniciar sesión.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
        <Text style={styles.label}>Usuario</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingrese su nombre de usuario"
          placeholderTextColor="#fff"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          keyboardType="default"
          returnKeyType="next"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingrese su contraseña"
          placeholderTextColor="#fff"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="done"
        />
      
      <View style={styles.buttonContainer}>
        <Button title="Iniciar Sesión" onPress={handleLogin}/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 250,
    padding: 20,
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  input: {
    height: 40,
    borderColor: 'white',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
      color: '#fff',
      backgroundColor: '#000000',
  },
    label: {
      color: '#fff',
      marginBottom: 6,
      fontSize: 14,
    },
  buttonContainer: {
    marginTop: 10,
  },
});