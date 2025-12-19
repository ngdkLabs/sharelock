import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { BottomNavigation } from '@/components/BottomNavigation';
import bgBlur from '@/assets/bg-blur.png';

interface Friend {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

const ChatPage = () => {
  const navigate = useNavigate();
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const handleLocationClick = (lat: number, lng: number) => {
    navigate(`/map?lat=${lat}&lng=${lng}`);
  };

  return (
    <div className="min-h-screen relative">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgBlur})` }}
      />
      
      <div className="relative z-10 h-screen flex flex-col pb-20">
        {selectedFriend ? (
          <ChatWindow
            friend={selectedFriend}
            onBack={() => setSelectedFriend(null)}
            onLocationClick={handleLocationClick}
          />
        ) : (
          <ChatList
            onSelectFriend={setSelectedFriend}
            selectedFriendId={selectedFriend?.id}
          />
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ChatPage;
