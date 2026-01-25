import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';

const EMPLOYEES = [
  { id: 1, name: 'Sarah Jenkins', role: 'Store Manager', status: 'Active', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
  { id: 2, name: 'Mike Ross', role: 'Kitchen Staff', status: 'Active', image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200' },
  { id: 3, name: 'Jessica Pearson', role: 'Cashier', status: 'Inactive', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200' },
];

export default function EmployeeManagementScreen() {
  const router = useRouter();
  const [employees, setEmployees] = useState(EMPLOYEES);

  const handleAddEmployee = () => {
    Alert.alert('Add Employee', 'This would open a form to add a new staff member.');
  };

  const handleRemoveEmployee = (id: number) => {
    Alert.alert(
      'Remove Employee',
      'Are you sure you want to remove this employee?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setEmployees(prev => prev.filter(e => e.id !== id))
        }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Employee Management',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
             <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={handleAddEmployee}>
             <IconSymbol size={20} name="add" color="#C2185B" />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
             <ThemedText style={styles.statVal}>{employees.filter(e => e.status === 'Active').length}</ThemedText>
             <ThemedText style={styles.statLabel}>Active Staff</ThemedText>
          </View>
          <View style={styles.statCard}>
             <ThemedText style={styles.statVal}>{employees.length}</ThemedText>
             <ThemedText style={styles.statLabel}>Total Accounts</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.sectionTitle}>Staff List</ThemedText>

        {employees.map((employee) => (
          <View key={employee.id} style={styles.employeeCard}>
             <Image source={{ uri: employee.image }} style={styles.avatar} />
             
             <View style={styles.info}>
                <ThemedText style={styles.name}>{employee.name}</ThemedText>
                <ThemedText style={styles.role}>{employee.role}</ThemedText>
                
                <View style={[styles.statusBadge, employee.status === 'Inactive' && styles.statusBadgeInactive]}>
                   <View style={[styles.statusDot, employee.status === 'Inactive' && styles.statusDotInactive]} />
                   <ThemedText style={[styles.statusText, employee.status === 'Inactive' && styles.statusTextInactive]}>
                      {employee.status}
                   </ThemedText>
                </View>
             </View>

             <TouchableOpacity style={styles.moreBtn} onPress={() => handleRemoveEmployee(employee.id)}>
                <IconSymbol size={20} name="trash.fill" color="#AAA" />
             </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={handleAddEmployee}>
           <IconSymbol size={20} name="add" color="#FFF" />
           <ThemedText style={styles.addBtnText}>Add New Employee</ThemedText>
        </TouchableOpacity>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statVal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#C2185B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 16,
    marginLeft: 4,
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEE',
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  role: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  statusBadgeInactive: {
    backgroundColor: '#F5F5F5',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  statusDotInactive: {
    backgroundColor: '#9E9E9E',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  statusTextInactive: {
    color: '#757575',
  },
  moreBtn: {
    padding: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C2185B',
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    gap: 8,
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
