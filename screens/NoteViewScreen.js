// screens/NoteViewScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Markdown from 'react-native-markdown-display';
import { API_URL } from '../constants';
import { confirm, notify } from '../utils/alert';

export default function NoteViewScreen({ route, navigation }) {
    const { noteId, token, user } = route.params;

    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    const fetchNote = async () => {
        try {
            const res = await fetch(`${API_URL}/api/notes/${noteId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                notify('Error', data.error || 'Could not load note.');
                navigation.goBack();
                return;
            }
            setNote(data);
        } catch (e) {
            console.error(e);
            notify('Network error', 'Could not reach the server.');
        } finally {
            setLoading(false);
        }
    };

    // Refetch whenever the screen comes into focus (so edits show up immediately)
    useFocusEffect(
        useCallback(() => {
            fetchNote();
        }, [noteId])
    );

    const handleDelete = async () => {
        const ok = await confirm(
            'Delete note',
            `Delete "${note.title}"? This cannot be undone.`,
            'Delete',
            true
        );
        if (!ok) return;

        setDeleting(true);
        try {
            const res = await fetch(`${API_URL}/api/notes/${noteId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok && res.status !== 204) {
                const data = await res.json().catch(() => ({}));
                notify('Delete failed', data.error || `Status ${res.status}`);
                return;
            }
            navigation.goBack();
        } catch (e) {
            console.error(e);
            notify('Network error', 'Could not reach the server.');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#89b4fa" size="large" />
            </View>
        );
    }
    if (!note) return null;

    const isOwner = user && note.user_id === user.id;
    const isAdmin = user && user.role === 'admin';
    const canEdit = isOwner || isAdmin;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Header */}
                <Text style={styles.title}>{note.title}</Text>
                <View style={styles.metaRow}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{note.subject}</Text>
                    </View>
                    <Text style={styles.metaText}>@{note.author}</Text>
                    {note.is_public === 1 && (
                        <Text style={styles.publicText}>· public</Text>
                    )}
                </View>

                {/* Markdown body */}
                <View style={styles.markdownWrap}>
                    <Markdown style={markdownStyles}>{note.content}</Markdown>
                </View>
            </ScrollView>

            {/* Action bar (only if user owns the note or is admin) */}
            {canEdit && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.editBtn]}
                        onPress={() =>
                            navigation.navigate('EditNote', {
                                noteId: note.id,
                                token,
                                user,
                                initial: {
                                    title: note.title,
                                    subject: note.subject,
                                    content: note.content,
                                    is_public: note.is_public === 1,
                                },
                            })
                        }
                    >
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.deleteBtn, deleting && { opacity: 0.6 }]}
                        onPress={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <ActivityIndicator color="#f38ba8" />
                        ) : (
                            <Text style={styles.deleteBtnText}>Delete</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

// Obsidian-ish markdown theme (Catppuccin Mocha)
const markdownStyles = {
    body: {
        color: '#cdd6f4',
        fontSize: 15,
        lineHeight: 22,
    },
    heading1: {
        color: '#cdd6f4',
        fontSize: 26,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    heading2: {
        color: '#cdd6f4',
        fontSize: 22,
        fontWeight: '700',
        marginTop: 14,
        marginBottom: 6,
    },
    heading3: {
        color: '#cdd6f4',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 12,
        marginBottom: 4,
    },
    paragraph: { marginVertical: 6 },
    strong: { fontWeight: '700', color: '#f5e0dc' },
    em: { fontStyle: 'italic', color: '#f5e0dc' },
    link: { color: '#89b4fa' },
    blockquote: {
        backgroundColor: '#181825',
        borderLeftWidth: 3,
        borderLeftColor: '#89b4fa',
        paddingLeft: 10,
        paddingVertical: 4,
        marginVertical: 6,
        color: '#a6adc8',
    },
    code_inline: {
        backgroundColor: '#313244',
        color: '#f5e0dc',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 4,
        fontFamily: 'monospace',
    },
    code_block: {
        backgroundColor: '#11111b',
        color: '#cdd6f4',
        padding: 10,
        borderRadius: 6,
        fontFamily: 'monospace',
        fontSize: 13,
        marginVertical: 8,
    },
    fence: {
        backgroundColor: '#11111b',
        color: '#cdd6f4',
        padding: 10,
        borderRadius: 6,
        fontFamily: 'monospace',
        fontSize: 13,
        marginVertical: 8,
    },
    bullet_list: { marginVertical: 4 },
    ordered_list: { marginVertical: 4 },
    list_item: { marginVertical: 2 },
    hr: { backgroundColor: '#313244', height: 1, marginVertical: 12 },
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#181825' },
    center: { flex: 1, backgroundColor: '#181825', justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 16, paddingBottom: 100 },
    title: { color: '#cdd6f4', fontSize: 24, fontWeight: '700', marginBottom: 8 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' },
    badge: {
        backgroundColor: '#313244',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginRight: 8,
    },
    badgeText: { color: '#a6adc8', fontSize: 11 },
    metaText: { color: '#6c7086', fontSize: 12, marginRight: 4 },
    publicText: { color: '#a6e3a1', fontSize: 12 },
    markdownWrap: {
        backgroundColor: '#1e1e2e',
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: '#313244',
    },
    actions: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        backgroundColor: '#1e1e2e',
        borderTopWidth: 1,
        borderTopColor: '#313244',
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    editBtn: { backgroundColor: '#89b4fa' },
    editBtnText: { color: '#1e1e2e', fontSize: 15, fontWeight: '700' },
    deleteBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#f38ba8' },
    deleteBtnText: { color: '#f38ba8', fontSize: 15, fontWeight: '700' },
});