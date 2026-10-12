import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, BarChart2, FileText, AlertTriangle, CheckCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import api, { getInspections, uploadVideo } from '../api';

type Props = {
  route: any;
};

export default function MachineDetails({ route }: Props) {
  const { machineId, name } = route.params;
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const data = await getInspections(parseInt(machineId, 10));
      setInspections(data);
    } catch (error) {
      console.log('Error fetching inspections');
    } finally {
      setLoading(false);
    }
  };

  const latest = inspections.length > 0 ? inspections[0] : null;

  const handleGenerateReport = async () => {
    if (!latest) return;
    const url = `${api.defaults.baseURL}/reports/${latest.id}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.log("Don't know how to open this URL:", url);
    }
  };

  const handleNewInspection = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      try {
        Alert.alert("Uploading", "Your video is being uploaded and processed...");
        const asset = result.assets[0];
        const filename = asset.fileName || `video_${Date.now()}.mp4`;
        await uploadVideo(parseInt(machineId, 10), asset.uri, filename);
        Alert.alert("Success", "Video uploaded! The analysis is running in the background.");
        fetchInspections(); // Refresh data
      } catch (e) {
        Alert.alert("Error", "Failed to upload video.");
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient 
        colors={['#18181B', '#09090B']} 
        style={styles.heroCard}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
      >
        {latest?.anomaly_flag === 'Warning' || latest?.anomaly_flag === 'Further inspection recommended' ? (
          <View style={styles.badgeWarning}>
            <AlertTriangle color="#F43F5E" size={16} />
            <Text style={styles.badgeTextWarning}>Anomaly Detected</Text>
          </View>
        ) : (
          <View style={[styles.badgeWarning, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
            <CheckCircle color="#10B981" size={16} />
            <Text style={[styles.badgeTextWarning, { color: '#10B981' }]}>System Optimal</Text>
          </View>
        )}
        <Text style={styles.heroTitle}>{name}</Text>
        <Text style={styles.heroSubtitle}>ID: M-{machineId} • Status: {latest?.status || 'No inspections'}</Text>
      </LinearGradient>

      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={handleNewInspection}>
          <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.actionGradient}>
            <Video color="#fff" size={24} />
            <Text style={styles.actionText}>New Inspection</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
          <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.actionGradient}>
            <BarChart2 color="#fff" size={24} />
            <Text style={styles.actionText}>View Trends</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Latest Inspection Results</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginVertical: 40 }} />
      ) : latest ? (
        <View style={styles.resultCard}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Dominant Frequency</Text>
            <Text style={styles.resultValue}>{latest.dominant_freq_hz?.toFixed(2) || 'N/A'} Hz</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Amplitude (Pixels)</Text>
            <Text style={latest.amplitude_pixels > 10 ? styles.resultValueDanger : styles.resultValue}>
              {latest.amplitude_pixels?.toFixed(2) || 'N/A'} px
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>RMS (Pixels)</Text>
            <Text style={latest.rms_pixels > 5 ? styles.resultValueDanger : styles.resultValue}>
              {latest.rms_pixels?.toFixed(2) || 'N/A'} px
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Anomaly Flag</Text>
            <Text style={latest.anomaly_flag !== 'No significant anomaly' ? styles.resultValueDanger : styles.resultValue}>
              {latest.anomaly_flag || 'None'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.resultCard}>
           <Text style={{ color: '#A1A1AA', textAlign: 'center' }}>No inspection data found for this machine.</Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.reportButton, !latest && { opacity: 0.5 }]} 
        activeOpacity={0.8}
        onPress={handleGenerateReport}
        disabled={!latest}
      >
        <FileText color="#A1A1AA" size={20} style={{ marginRight: 10 }} />
        <Text style={styles.reportButtonText}>Generate PDF Report</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
    padding: 20,
  },
  heroCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  badgeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  badgeTextWarning: {
    color: '#F43F5E',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 6,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 24,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  resultLabel: {
    fontSize: 16,
    color: '#A1A1AA',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resultValueDanger: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F43F5E',
  },
  divider: {
    height: 1,
    backgroundColor: '#27272A',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181B',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3F3F46',
    marginBottom: 40,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
