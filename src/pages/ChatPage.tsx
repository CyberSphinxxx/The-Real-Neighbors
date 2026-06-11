import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Menu, Users, ArrowLeft } from 'lucide-react';
import { ChannelSidebar } from '../components/chat/ChannelSidebar';
import { MessageArea } from '../components/chat/MessageArea';
import { MembersSidebar } from '../components/chat/MembersSidebar';
import { subscribeToChannels, subscribeToDMs } from '../lib/chat';
import { useAuthStore } from '../stores/authStore';
import type { Channel, DirectMessage } from '../types';

export default function ChatPage() {
  const { channelId, dmId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dms, setDMs] = useState<DirectMessage[]>([]);

  const [isMembersSidebarOpen, setIsMembersSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToChannels((data) => {
      setChannels(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToDMs(user.id, (data) => {
      setDMs(data);
    });
    return () => unsubscribe();
  }, [user]);

  // Cleanup duplicate Neighborhood channels
  useEffect(() => {
    const cleanupDuplicates = async () => {
      try {
        const { getDocs, collection, deleteDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        
        const snapshot = await getDocs(collection(db, 'channels'));
        const channels = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Channel[];
        const neighborhoods = channels.filter(c => c.name === 'Neighborhood');
        
        // If there are duplicates, keep the first one and delete the rest
        if (neighborhoods.length > 1) {
          for (let i = 1; i < neighborhoods.length; i++) {
            await deleteDoc(doc(db, 'channels', neighborhoods[i].id));
          }
        }
      } catch (error) {
        console.error("Failed to cleanup channels", error);
      }
    };
    
    cleanupDuplicates();
  }, []);
  useEffect(() => {
    if (!isMobile && channels.length > 0 && !channelId && !dmId) {
      const defaultChannel = channels.find(c => c.isDefault) || channels[0];
      if (defaultChannel) {
        navigate(`/chat/${defaultChannel.id}`, { replace: true });
      }
    }
  }, [channels, channelId, dmId, navigate, isMobile]);

  const activeChannel = channels.find(c => c.id === channelId);
  const activeDM = dms.find(d => d.id === dmId);
  
  const getHeaderTitle = () => {
    if (activeChannel) {
      return (
        <>
          <span className="text-xl">{activeChannel.emoji}</span>
          <span className="text-main">{activeChannel.name}</span>
        </>
      );
    }
    if (activeDM) {
      return <span className="text-main">Direct Message</span>;
    }
    return <span className="text-main">Chat</span>;
  };

  return (
    <div className="flex flex-col h-full w-full bg-base overflow-hidden relative" style={{ minHeight: '100%' }}>
      {/* Mobile Header (Only visible on small screens when in MessageArea) */}
      <div className={`md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border-subtle flex-shrink-0 z-20 ${!channelId && !dmId ? 'hidden' : 'flex'}`}>
        <button 
          onClick={() => navigate('/chat')}
          className="p-2 -ml-2 text-muted hover:text-main transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2 font-semibold">
          {getHeaderTitle()}
        </div>
        <button 
          onClick={() => setIsMembersSidebarOpen(true)}
          className="p-2 -mr-2 text-muted hover:text-main transition-colors"
        >
          <Users size={24} />
        </button>
      </div>

      {/* Main 3-Pane Layout */}
      <div className="flex flex-1 overflow-hidden relative w-full h-full bg-base">
        {/* Left Pane: Channels */}
        <div className={`
          ${isMobile ? (
            (!channelId && !dmId) ? 'absolute inset-0 z-10 bg-base w-full flex flex-col' : 'hidden'
          ) : (
            'relative w-[240px] bg-transparent border-r border-border-subtle flex-shrink-0'
          )}
        `}>
          <ChannelSidebar 
            channels={channels} 
            dms={dms}
            activeChannelId={channelId}
            activeDmId={dmId}
            onCloseMobile={() => {}}
          />
        </div>

        {/* Center Pane: Messages */}
        <div className={`
          flex-1 flex-col min-w-0 bg-surface relative z-10 h-full shadow-2xl md:shadow-none
          ${isMobile && (!channelId && !dmId) ? 'hidden' : 'flex'}
        `}>
          {activeChannel ? (
            <MessageArea threadType="channels" threadId={activeChannel.id} channel={activeChannel} />
          ) : activeDM ? (
            <MessageArea threadType="dms" threadId={activeDM.id} dm={activeDM} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted gap-4 bg-pattern-grid">
              <div className="w-20 h-20 rounded-full bg-base border border-border-subtle flex items-center justify-center shadow-inner">
                <Menu size={32} className="text-border-subtle opacity-50" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-main mb-1">Welcome to the Neighborhood</h3>
                <p className="text-sm">Select a channel or conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Members */}
        <div className={`
          absolute inset-y-0 right-0 z-20 w-[240px] md:w-[220px] bg-base/80 backdrop-blur-md md:bg-transparent border-l border-border-subtle transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
          ${isMembersSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <MembersSidebar 
            onCloseMobile={() => setIsMembersSidebarOpen(false)}
          />
        </div>

        {/* Mobile Overlays */}
        {(isMembersSidebarOpen) && (
          <div 
            className="absolute inset-0 bg-black/50 z-10 md:hidden"
            onClick={() => {
              setIsMembersSidebarOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
