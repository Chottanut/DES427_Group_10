import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableHighlight,
} from 'react-native';

// const dummyData = [
//   { id: 1, name: 'Patchy', tag: 'gamer' },
//   { id: 2, name: 'Alice', tag: 'dev' },
//   { id: 3, name: 'Ami', tag: 'music' },
// ];

// export default function HomeScreen() {
//   const [searchText, setSearchText] = useState('');
//   const [results, setResults] = useState(dummyData);

//   const handleSearch = () => {
//     const filtered = dummyData.filter(user =>
//       user.name.toLowerCase().includes(searchText.toLowerCase()) ||
//       user.tag.toLowerCase().includes(searchText.toLowerCase())
//     );
//     setResults(filtered);
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.searchRow}>
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search"
//           placeholderTextColor="#ccc"
//           value={searchText}
//           onChangeText={setSearchText}
//         />
//         <TouchableHighlight onPress={handleSearch} underlayColor="white">
//           <View style={styles.searchButton}>
//             <Image style={{ height: 30, width: 30 }} source={require('../../assets/button_images/search_icon.png')}
//             />
//           </View>
//         </TouchableHighlight>
//       </View>

//       {/* Show filtered results */}
//       {results.map(user => (
//         <View key={user.id} style={styles.card}>
//           <Text style={{ fontSize: 16 }}>{user.name}</Text>
//           <Text style={{ fontSize: 12, color: '#666' }}>#{user.tag}</Text>
//         </View>
//       ))}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     paddingTop: 60,
//     paddingHorizontal: 16,
//     backgroundColor: '#d8d7e6',
//     flex: 1,
//   },
//   searchRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   searchInput: {
//     flex: 1,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#333',
//     paddingHorizontal: 16,
//     color: '#fff',
//     marginRight: 10,
//   },
//   searchButton: {
//     padding: 6,
//   },
//   card: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//   },
// });
