import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminScreen from '../screens/AdminScreen';
import LoginScreen from '../screens/LoginScreen';
import MovieScreen from '../screens/MovieScreen';

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0d1117',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackVisible: false,
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ 
            title: 'Iniciar Sesión',
          }}
        />
        <Stack.Screen
          name="Admin"
          component={AdminScreen}
          options={{ 
            title: 'Panel de Administración',
          }}
        />
        <Stack.Screen
          name="Movie"
          component={MovieScreen}
          options={{ 
            title: 'Películas',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
