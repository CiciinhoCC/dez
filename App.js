// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import NotesScreen from './screens/NotesScreen';       // replaces Personal + Public
import NoteViewScreen from './screens/NoteViewScreen';
import EditNoteScreen from './screens/EditNoteScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: '#1e1e2e' },
          headerTintColor: '#cdd6f4',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#181825' },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="Notes"
          component={NotesScreen}
          options={{ title: 'Notas' }}
        />
        <Stack.Screen
          name="NoteView"
          component={NoteViewScreen}
          options={{ title: 'Nota' }}
        />
        <Stack.Screen
          name="EditNote"
          component={EditNoteScreen}
          options={{ title: 'Editar Nota' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}