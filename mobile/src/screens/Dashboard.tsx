import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { getMachines } from '../api';

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

type Props = {
  navigation: DashboardNavigationProp;
};

export default function Dashboard({ navigation }: Props) {
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const data = await getMachines();
      setMachines(data);
    } catch (error) {
      console.log('Could not fetch machines, backend might be offline.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Overview</Text>
        <Text style={styles.subtitle}>Welcome back, Inspector.</Text>
      </View>

      <View style={styles.statsContainer}>
        <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.statCard} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
          <Activity color="#fff" size={24} />
          <Text style={styles.statValue}>{machines.length}</Text>
          <Text style={styles.statLabel}>Total Machines</Text>
        </LinearGradient>
        
        <LinearGradient colors={['#F43F5E', '#E11D48']} style={styles.statCard} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
          <AlertTriangle color="#fff" size={24} />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Needs Attention</Text>
        </LinearGradient>
      </View>

      <Text style={styles.sectionTitle}>Recent Inspections</Text>
      
      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
        ) : machines.length === 0 ? (
          <Text style={{ color: '#A1A1AA', textAlign: 'center', marginTop: 20 }}>No machines registered yet.</Text>
        ) : (
          machines.map((machine) => (
            <TouchableOpacity 
              key={machine.id} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('MachineDetails', { machineId: machine.id.toString(), name: machine.name })}
            >
              <LinearGradient 
                colors={['#18181B', '#27272A']} 
                style={styles.machineCard}
                start={{x: 0, y: 0}} 
                end={{x: 1, y: 1}}
              >
                <View style={styles.machineInfo}>
                  <Text style={styles.machineName}>{machine.name}</Text>
                  <Text style={styles.machineDate}>Type: {machine.type || 'N/A'}</Text>
                </View>
                <View style={styles.statusBadge}>
                    <CheckCircle color="#10B981" size={28} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
    padding: 20,
  },
  header: {
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A1A1AA',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 40,
  },
  machineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  machineInfo: {
    flex: 1,
  },
  machineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  machineDate: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  statusBadge: {
    padding: 10,
    backgroundColor: '#09090B',
    borderRadius: 12,
  },
});
