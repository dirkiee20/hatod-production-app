import { StyleSheet, View, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useEffect, useRef, useState } from 'react';

export default function OrderTrackingScreen() {
  const router = useRouter();
  const [status, setStatus] = useState('FINDING_RIDER');
  // Animation for the "pulse" effect finding a rider
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Simulate finding a rider after 3 seconds
    const timer = setTimeout(() => {
      setStatus('RIDER_FOUND');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Map Placeholder Area */}
      <View style={styles.mapArea}>
        <View style={styles.mapPlaceholder}>
            {/* Simple grid pattern to look like a map */}
            <View style={styles.gridLineHorizontal} />
            <View style={[styles.gridLineHorizontal, { top: '30%' }]} />
            <View style={[styles.gridLineHorizontal, { top: '60%' }]} />
            
            <View style={styles.gridLineVertical} />
            <View style={[styles.gridLineVertical, { left: '30%' }]} />
            <View style={[styles.gridLineVertical, { left: '60%' }]} />

            {/* Path */}
            <View style={styles.routePath} />
        </View>

        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <IconSymbol size={24} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet Status Card */}
      <ThemedView style={styles.bottomSheet}>
        <View style={styles.dragHandle} />
        
        {status === 'FINDING_RIDER' ? (
            <View style={styles.statusContainer}>
                <ThemedText style={styles.statusTitle}>Finding your rider...</ThemedText>
                <ThemedText style={styles.statusSub}>Connecting you with nearby riders</ThemedText>
                
                <Animated.View style={[styles.radarCircle, { transform: [{ scale: pulseAnim }] }]}>
                    <IconSymbol size={40} name="paperplane.fill" color="#FFF" />
                </Animated.View>
                
                <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
                    <ThemedText style={styles.cancelText}>Cancel Order</ThemedText>
                </TouchableOpacity>
            </View>
        ) : (
            <View style={styles.statusContainer}>
                <View style={styles.riderInfoRow}>
                    <View style={styles.riderAvatar}>
                        <IconSymbol size={30} name="person" color="#555" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <ThemedText style={styles.riderName}>Juan Dela Cruz</ThemedText>
                        <View style={styles.ratingRow}>
                            <IconSymbol size={14} name="person" color="#FFD700" /> 
                            <ThemedText style={styles.ratingText}>4.9 (124 deliveries)</ThemedText>
                        </View>
                    </View>
                    <View style={styles.plateBadge}>
                        <ThemedText style={styles.plateText}>ABC 1234</ThemedText>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.timelineContainer}>
                     <View style={styles.timelineItem}>
                        <View style={styles.timelineDotActive} />
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.timelineTitle}>Rider is on the way to restaurant</ThemedText>
                            <ThemedText style={styles.timelineTime}>Arriving in 5 mins</ThemedText>
                        </View>
                     </View>
                     <View style={styles.timelineLine} />
                     <View style={styles.timelineItem}>
                        <View style={styles.timelineDotInactive} />
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.timelineTitleInactive}>Heading to you</ThemedText>
                        </View>
                     </View>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.messageBtn}>
                        <IconSymbol size={20} name="paperplane.fill" color="#C2185B" />
                        <ThemedText style={styles.messageText}>Message</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.callBtn}>
                        <IconSymbol size={20} name="person" color="#FFF" /> 
                        <ThemedText style={styles.callText}>Call</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        )}

      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    position: 'relative',
    overflow: 'hidden',
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#90CAF9',
    top: '10%'
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#90CAF9',
    left: '10%'
  },
  routePath: {
    position: 'absolute',
    top: '30%',
    left: '30%',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: '#C2185B',
    borderStyle: 'dashed',
    transform: [{ rotate: '45deg' }]
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    alignItems: 'center',
    width: '100%',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
    marginBottom: 4,
  },
  statusSub: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  radarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C2185B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
  },
  riderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  plateBadge: {
    backgroundColor: '#FCE4EC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  plateText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#C2185B',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#EEE',
    marginBottom: 20,
  },
  timelineContainer: {
    width: '100%',
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: '#DDD',
    marginLeft: 5,
    marginVertical: 4,
  },
  timelineDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C2185B',
    marginTop: 4,
  },
  timelineDotInactive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DDD',
    marginTop: 4,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  timelineTitleInactive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  timelineTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  messageBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FCE4EC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  messageText: {
    color: '#C2185B',
    fontWeight: '800',
    fontSize: 14,
  },
  callBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#C2185B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
