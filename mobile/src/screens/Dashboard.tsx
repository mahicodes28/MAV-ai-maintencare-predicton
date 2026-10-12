import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Activity, AlertTriangle, CheckCircle, Plus, X, Trash2 } from 'lucide-react-native';
import { getMachines, createMachine, deleteMachine } from '../api';

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

type Props = {
  navigation: DashboardNavigationProp;
};

export default function Dashboard({ navigation }: Props) {
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleAddMachine = async () => {
    if (!name.trim() || !type.trim() || !location.trim()) {
      Alert.alert('Validation Error', 'Please fill in Name, Type, and Location.');
      return;
    }
    try {
      setSubmitting(true);
      await createMachine({
        name: name.trim(),
        type: type.trim(),
        location: location.trim(),
        details: details.trim() || undefined,
      });
      setName('');
      setType('');
      setLocation('');
      setDetails('');
      setModalVisible(false);
      await fetchMachines();
      Alert.alert('Success', 'New machine added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add machine. Please check network connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async (machineId: number, machineName: string) => {
    try {
      await deleteMachine(machineId);
      await fetchMachines();
      Alert.alert('Deleted', `"${machineName}" was removed.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete machine.');
    }
  };

  const handleDeleteMachine = (machineId: number, machineName: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to delete "${machineName}"?`)) {
        confirmDelete(machineId, machineName);
      }
    } else {
      Alert.alert(
        'Delete Equipment',
        `Are you sure you want to delete "${machineName}"? This will also remove its inspection records.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(machineId, machineName) },
        ]
      );
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

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Equipment Registry</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
        >
          <Plus color="#FFFFFF" size={18} />
          <Text style={styles.addButtonText}>Add Machine</Text>
        </TouchableOpacity>
      </View>
      
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
                  <Text style={styles.machineLocation}>Location: {machine.location || 'N/A'}</Text>
                </View>
                <View style={styles.actionsGroup}>
                  <View style={styles.statusBadge}>
                    <CheckCircle color="#10B981" size={24} />
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteIconButton} 
                    onPress={(e) => {
                      e.stopPropagation?.();
                      handleDeleteMachine(machine.id, machine.name);
                    }}
                  >
                    <Trash2 color="#EF4444" size={20} />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Add Machine Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Equipment</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#A1A1AA" size={22} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Machine Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Hydraulic Pump #3"
              placeholderTextColor="#71717A"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Equipment Type *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Pump, Motor, Turbine"
              placeholderTextColor="#71717A"
              value={type}
              onChangeText={setType}
            />

            <Text style={styles.inputLabel}>Location *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Floor 2, Sector B"
              placeholderTextColor="#71717A"
              value={location}
              onChangeText={setLocation}
            />

            <Text style={styles.inputLabel}>Details / Specifications</Text>
            <TextInput
              style={[styles.textInput, { height: 70 }]}
              placeholder="Optional notes or operational ratings"
              placeholderTextColor="#71717A"
              multiline
              value={details}
              onChangeText={setDetails}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, submitting && { opacity: 0.6 }]} 
                onPress={handleAddMachine}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Machine</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    padding: 8,
    backgroundColor: '#09090B',
    borderRadius: 12,
  },
  deleteIconButton: {
    padding: 8,
    backgroundColor: '#1C1917',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  machineLocation: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A1A1AA',
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#09090B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  cancelButtonText: {
    color: '#A1A1AA',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
