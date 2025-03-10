import json
from channels.generic.websocket import AsyncWebsocketConsumer
from app.users.models import UserOnlineStatus
from channels.db import database_sync_to_async
from django.utils import timezone

"""

Friend Invitation Consumer

"""

class FriendInvitationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"friend_invitation_{self.room_name}"
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        print(f"Connected to friend room: {self.room_name}, group: {self.room_group_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"Disconnected from friend room: {self.room_name}, group: {self.room_group_name}")

    async def friend_accepted(self, event):
        friendship = event['friendship']
        await self.send(text_data=json.dumps({
            'type': 'friend_accepted',
            'friendship': friendship
        }))
        print(f"Sent friend accepted to room: {self.room_name}, group: {self.room_group_name}")

    async def friend_invited(self, event):
        friendship = event['friendship']
        await self.send(text_data=json.dumps({
            'type': 'friend_invited',
            'friendship': friendship
        }))
        print(f"Sent friend invitation to room: {self.room_name}")


"""

User Online Status Consumer

"""

class UserOnlineStatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return

        self.group_name = "online_users"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        
        await self.set_user_online()
        
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "online_status",
                "user_id": self.user.id,
                "username": self.user.username,
                "is_online": True,
                "last_seen": timezone.now().isoformat()
            }
        )
        
        await self.accept()

    async def disconnect(self, close_code): # TODO: SOMETIMES MESSAGE IS NOT SENT. RACE CONDITION? THIS MUST BE FIXED
        if hasattr(self, 'user') and self.user.is_authenticated:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "online_status",
                    "user_id": self.user.id,
                    "username": self.user.username,
                    "is_online": False,
                    "last_seen": timezone.now().isoformat()
                }
            )
            
            await self.set_user_offline()
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def online_status(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def set_user_online(self):
        UserOnlineStatus.objects.update_or_create(
            user=self.user,
            defaults={"is_online": True, "last_seen": timezone.now()}
        )

    @database_sync_to_async
    def set_user_offline(self):
        UserOnlineStatus.objects.update_or_create(
            user=self.user,
            defaults={"is_online": False, "last_seen": timezone.now()}
        )
