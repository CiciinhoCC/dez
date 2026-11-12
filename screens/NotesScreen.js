// screens/NotesScreen.js
import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';   // NEW: useLayoutEffect
import {
    View, Text, TextInput, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { API_URL } from '../constants';

const SCOPES = [
    { key: 'all', label: 'All' },
    { key: 'mine', label: 'Mine' },
    { key: 'public', label: 'Public' },
];

export default function NotesScreen({ route, navigation }) {
    const { token, user } = route.params;   // NEW: also grab user

    const [scope, setScope] = useState('all');
    const [subject, setSubject] = useState(null);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // NEW: "+" button in the header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={() =>
                        navigation.navigate('EditNote', { token, user })
                    }
                >
                    <Text style={{ color: '#89b4fa', fontSize: 28, paddingHorizontal: 10, fontWeight: '400' }}>
                        + Criar
                    </Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, token, user]);

    // Debounce search
    useEffect(() => {
        const id = setTimeout(() => setDebouncedQuery(query.trim()), 300);
        return () => clearTimeout(id);
    }, [query]);

    // Load subjects once
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_URL}/api/notes/subjects`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) setSubjects(await res.json());
            } catch (e) { console.error(e); }
        })();
    }, [token]);

    const fetchNotes = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ scope });
            if (subject) params.append('subject', subject);
            if (debouncedQuery) params.append('q', debouncedQuery);

            const res = await fetch(`${API_URL}/api/notes?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) setNotes(data);
            else console.error(data.error);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, [token, scope, subject, debouncedQuery]);

    useEffect(() => { fetchNotes(); }, [fetchNotes]);

    const onRefresh = () => { setRefreshing(true); fetchNotes(); };

    const renderNote = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() =>
                navigation.navigate('NoteView', { noteId: item.id, token, user })   // NEW: pass user
            }
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.subject}</Text>
                </View>
            </View>
            <Text style={styles.cardPreview} numberOfLines={2}>
                {item.content.replace(/[#*`>_~\-]/g, '').slice(0, 120)}
            </Text>
            <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>@{item.author}</Text>
                {item.is_public === 1 && (
                    <Text style={styles.cardMetaPublic}>· public</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.search}
                placeholder="Search notes, content, authors…"
                placeholderTextColor="#6c7086"
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
            />

            <View style={styles.scopeRow}>
                {SCOPES.map(s => (
                    <TouchableOpacity
                        key={s.key}
                        style={[styles.scopeChip, scope === s.key && styles.scopeChipActive]}
                        onPress={() => setScope(s.key)}
                    >
                        <Text style={[
                            styles.scopeText,
                            scope === s.key && styles.scopeTextActive,
                        ]}>{s.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {subjects.length > 0 && (
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={['__all__', ...subjects]}
                    keyExtractor={s => s}
                    contentContainerStyle={styles.subjectRow}
                    renderItem={({ item }) => {
                        const isAll = item === '__all__';
                        const active = isAll ? subject === null : subject === item;
                        return (
                            <TouchableOpacity
                                style={[styles.subjectChip, active && styles.subjectChipActive]}
                                onPress={() => setSubject(isAll ? null : item)}
                            >
                                <Text style={[
                                    styles.subjectText,
                                    active && styles.subjectTextActive,
                                ]}>{isAll ? 'All subjects' : item}</Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}

            {loading && !refreshing ? (
                <ActivityIndicator style={{ marginTop: 40 }} color="#89b4fa" />
            ) : (
                <FlatList
                    data={notes}
                    keyExtractor={n => String(n.id)}
                    renderItem={renderNote}
                    contentContainerStyle={{ padding: 16, paddingTop: 8 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#89b4fa"
                        />
                    }
                    ListEmptyComponent={
                        <Text style={styles.empty}>No notes found.</Text>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#181825' },
    search: {
        backgroundColor: '#1e1e2e',
        borderColor: '#313244',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        color: '#cdd6f4',
        fontSize: 15,
        margin: 16,
        marginBottom: 10,
    },
    scopeRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 10,
        gap: 8,
    },
    scopeChip: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#1e1e2e',
        borderWidth: 1,
        borderColor: '#313244',
        alignItems: 'center',
    },
    scopeChipActive: {
        backgroundColor: '#89b4fa',
        borderColor: '#89b4fa',
    },
    scopeText: { color: '#a6adc8', fontSize: 14, fontWeight: '600' },
    scopeTextActive: { color: '#1e1e2e' },

    subjectRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 10 },
    subjectChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#1e1e2e',
        borderWidth: 1,
        borderColor: '#313244',
    },
    subjectChipActive: {
        backgroundColor: '#a6e3a1',
        borderColor: '#a6e3a1',
    },
    subjectText: { color: '#a6adc8', fontSize: 13 },
    subjectTextActive: { color: '#1e1e2e', fontWeight: '600' },

    card: {
        backgroundColor: '#1e1e2e',
        borderRadius: 10,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#313244',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    cardTitle: {
        color: '#cdd6f4',
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
        marginRight: 8,
    },
    badge: {
        backgroundColor: '#313244',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    badgeText: { color: '#a6adc8', fontSize: 11 },
    cardPreview: { color: '#a6adc8', fontSize: 13, lineHeight: 18 },
    cardFooter: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
    cardMeta: { color: '#6c7086', fontSize: 12 },
    cardMetaPublic: { color: '#a6e3a1', fontSize: 12, marginLeft: 4 },
    empty: { color: '#6c7086', textAlign: 'center', marginTop: 40 },
});