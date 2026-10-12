import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import Dashboard from './src/screens/Dashboard';
import MachineDetails from './src/screens/MachineDetails';

export type RootStackParamList = {
  Dashboard: undefined;
  MachineDetails: { machineId: string; name: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator 
        screenOptions={{
          headerStyle: {
            backgroundColor: '#09090B', // Zinc-950
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#09090B'
          }
        }}
      >
        <Stack.Screen 
          name="Dashboard" 
          component={Dashboard} 
          options={{ title: 'VibeHealth AI' }} 
        />
        <Stack.Screen 
          name="MachineDetails" 
          component={MachineDetails} 
          options={({ route }) => ({ title: route.params.name })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
