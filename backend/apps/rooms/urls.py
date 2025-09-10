from django.urls import path
from . import views

urlpatterns = [
    # Room management
    path('', views.RoomListCreateView.as_view(), name='room-list-create'),
    path('<uuid:pk>/', views.RoomDetailView.as_view(), name='room-detail'),
    path('<uuid:room_id>/members/', views.RoomMembersView.as_view(), name='room-members'),
    
    # Room actions
    path('join/', views.join_room, name='join-room'),
    path('<uuid:room_id>/leave/', views.leave_room, name='leave-room'),
    path('<uuid:room_id>/invite/', views.create_invite, name='create-invite'),
    
    # Public endpoints
    path('by-code/<str:room_code>/', views.room_by_code, name='room-by-code'),
]