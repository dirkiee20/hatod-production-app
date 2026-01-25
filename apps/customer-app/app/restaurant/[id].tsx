import { StyleSheet, ScrollView, TouchableOpacity, Image, View, Animated } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useRef } from 'react';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  const restaurant = {
    name: 'Greenwich - Surigao',
    rating: '5.0',
    reviews: '5000+ ratings',
    time: '15-40 min',
    distance: '1.2 km',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
    logo: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=100', 
    tags: ['Pizza', 'American', 'Fast Food'],
    promos: ['50% off (WEMISSYOU)', 'Free delivery with ₱500 spend'],
  };

  const menu = [
    {
      title: 'Popular',
      items: [
        { id: '1', name: 'Signature Double Cheese', price: 299, description: 'Double beef patty, quadruple cheese, secret sauce.', image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400' },
        { id: '2', name: 'Bacon Blast Burger', price: 349, description: 'Crispy bacon, smoky bbq sauce, onion rings.', image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400' },
      ],
    },
    {
      title: 'Solo Meals',
      items: [
        { id: '3', name: 'Classic Burger Solo', price: 150, description: 'Single patty with fresh veggies.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
        { id: '4', name: 'Chicken Burger', price: 180, description: 'Deep fried chicken breast with mayo.', image: 'https://images.unsplash.com/photo-1510629954389-c1e0da47d414?w=400' },
      ],
    }
  ];

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const controlOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Sticky Top Header (Integrated Icons) */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{transform: [{rotate: '180deg'}]}} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>{restaurant.name}</ThemedText>
          <View style={styles.headerActions}>
            <IconSymbol size={18} name="filter" color="#000" style={{marginLeft: 15}} />
            <IconSymbol size={18} name="person" color="#000" style={{marginLeft: 15}} />
          </View>
        </View>
      </Animated.View>

      {/* Floating Buttons (Fades out on scroll) */}
      <Animated.View style={[styles.floatingControls, { opacity: controlOpacity }]}>
        <TouchableOpacity style={styles.floatingButton} onPress={() => router.back()}>
          <IconSymbol size={20} name="chevron.right" color="#000" style={{transform: [{rotate: '180deg'}]}} />
        </TouchableOpacity>
        
        <ThemedView style={styles.rightActions}>
          <TouchableOpacity style={styles.floatingButton}>
            <IconSymbol size={18} name="filter" color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.floatingButton}>
            <IconSymbol size={18} name="person" color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.floatingButton}>
            <IconSymbol size={18} name="send" color="#000" />
          </TouchableOpacity>
        </ThemedView>
      </Animated.View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <ThemedView style={styles.bannerContainer}>
          <Image source={{ uri: restaurant.image }} style={styles.bannerImage} />
          <ThemedView style={styles.identityRow}>
            <ThemedView style={styles.logoBox}>
              <Image source={{ uri: restaurant.logo }} style={styles.restaurantLogo} />
            </ThemedView>
            <ThemedText style={styles.restaurantNameBeside}>{restaurant.name}</ThemedText>
          </ThemedView>
        </ThemedView>
        
        <ThemedView style={styles.infoCard}>
          <ThemedView style={styles.infoContent}>
            <ThemedView style={styles.ratingRow}>
              <ThemedText style={styles.ratingStar}>★</ThemedText>
              <ThemedText style={styles.ratingValue}>{restaurant.rating}</ThemedText>
              <ThemedText style={styles.ratingCount}>({restaurant.reviews})</ThemedText>
            </ThemedView>

            <ThemedView style={styles.deliveryCard}>
              <ThemedView style={styles.deliveryTextGroup}>
                <ThemedText style={styles.deliveryTitle}>Delivery {restaurant.time}</ThemedText>
                <ThemedText style={styles.deliverySub}>₱ 29.00 delivery or free with ₱ 349.00 spend</ThemedText>
              </ThemedView>
              <ThemedText style={styles.changeAction}>Change</ThemedText>
            </ThemedView>

            <ThemedView style={styles.promoHighlight}>
              <ThemedText style={styles.promoTitleText}>🎫 50% off (WEMISSYOU)</ThemedText>
              <ThemedText style={styles.promoBodyText}>Min. order ₱ 149 Valid for all items.</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Categories */}
        <ThemedView style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {menu.map((cat, i) => (
              <TouchableOpacity key={i} onPress={() => setActiveCategory(i)} style={[styles.tab, activeCategory === i && styles.activeTab]}>
                <ThemedText style={[styles.tabText, activeCategory === i && styles.activeTabText]}>{cat.title}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>

        {/* Menu Items */}
        <ThemedView style={styles.menuSection}>
          {menu.map((section, sIndex) => (
            <ThemedView key={sIndex} style={styles.menuGroup}>
              <ThemedText style={styles.groupTitle}>{section.title}</ThemedText>
              {section.items.map((item) => (
                <TouchableOpacity 
                   key={item.id} 
                   style={styles.menuItem}
                   onPress={() => router.push(`/menu-item/${item.id}`)}
                >
                  <ThemedView style={styles.itemInfo}>
                    <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                    <ThemedText style={styles.itemDesc} numberOfLines={2}>{item.description}</ThemedText>
                    <ThemedText style={styles.itemPrice}>₱{item.price}</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.itemImageWrapper}>
                    <Image source={{ uri: item.image }} style={styles.itemImg} />
                    <TouchableOpacity style={styles.addBtn}>
                      <IconSymbol size={22} name="add" color="#C2185B" />
                    </TouchableOpacity>
                  </ThemedView>
                </TouchableOpacity>
              ))}
            </ThemedView>
          ))}
        </ThemedView>
        
        <ThemedView style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Cart Preview */}
      <ThemedView style={styles.cartPreview}>
        <ThemedView style={styles.cartInfo}>
          <ThemedText style={styles.cartQty}>2 ITEMS</ThemedText>
          <ThemedText style={styles.cartTotal}>₱598</ThemedText>
        </ThemedView>
        <TouchableOpacity style={styles.viewBtn} onPress={() => router.push('/cart')}>
          <ThemedText style={styles.viewBtnText}>View Cart</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: '#FFF',
    zIndex: 100,
    paddingTop: 45,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  floatingControls: {
    position: 'absolute',
    top: 35,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 90, // Lower than stickyHeader
    backgroundColor: 'transparent',
  },
  rightActions: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  floatingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  bannerContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  identityRow: {
    position: 'absolute',
    bottom: -45, // Moved lower
    left: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
    zIndex: 110,
  },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  restaurantLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  restaurantNameBeside: {
    fontSize: 22,
    fontWeight: '900',
    color: '#333',
    marginLeft: 12,
    marginBottom: 10, 
  },
  infoCard: {
    paddingTop: 55, // Increased to accommodate the lower logo
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  infoContent: {
    backgroundColor: 'transparent',
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  ratingStar: {
    color: '#FFD700',
    fontSize: 14,
    marginRight: 4,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  ratingCount: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    backgroundColor: '#FFF',
  },
  deliveryTextGroup: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  deliveryTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  deliverySub: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  changeAction: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  promoHighlight: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF5F8',
    borderRadius: 10,
    borderColor: '#FFECF2',
    borderWidth: 1,
  },
  promoTitleText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#C2185B',
  },
  promoBodyText: {
    fontSize: 10,
    color: '#C2185B',
    marginTop: 2,
    opacity: 0.8,
  },
  tabContainer: {
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  tabScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tab: {
    marginRight: 20,
    paddingBottom: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#C2185B',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#C2185B',
    fontWeight: '800',
  },
  menuSection: {
    padding: 16,
  },
  menuGroup: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  groupTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    lineHeight: 16,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
  },
  itemImageWrapper: {
    width: 90,
    height: 90,
    position: 'relative',
  },
  itemImg: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },
  addBtn: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    backgroundColor: '#FFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cartPreview: {
    position: 'absolute',
    bottom: 25,
    left: 16,
    right: 16,
    backgroundColor: '#C2185B',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 10,
  },
  cartInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cartQty: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
  },
  cartTotal: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '900',
  },
  viewBtn: {
    backgroundColor: 'transparent',
  },
  viewBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
