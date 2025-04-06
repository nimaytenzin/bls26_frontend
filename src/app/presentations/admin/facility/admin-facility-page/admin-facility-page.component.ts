import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { FileUploadModule } from 'primeng/fileupload';
import { GalleriaModule } from 'primeng/galleria';

interface Post {
    id: number;
    author: string;
    avatar: string;
    content: string;
    image?: string;
    likes: number;
    comments: number;
    shares: number;
    timeAgo: string;
    isLiked: boolean;
}

interface Event {
    id: number;
    title: string;
    date: Date;
    startTime: string;
    endTime: string;
    description: string;
    location: string;
}

interface ChatContact {
    id: number;
    name: string;
    avatar: string;
    role: string;
    class?: string;
    lastMessage?: string;
    unreadCount: number;
    online: boolean;
}

interface ChatMessage {
    id: number;
    senderId: number;
    content: string;
    timestamp: Date;
    isOwn: boolean;
}

@Component({
    selector: 'app-admin-facility-page',
    templateUrl: './admin-facility-page.component.html',
    styleUrls: ['./admin-facility-page.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        AvatarModule,
        FormsModule,
        ButtonModule,
        InputTextareaModule,
        DialogModule,
        CalendarModule,
        FileUploadModule,
        GalleriaModule,
    ],
})
export class AdminFacilityPageComponent implements OnInit {
    // Basic Info
    coverImage = 'assets/images/eccdcoverimage.jpg';
    profileImage = 'assets/logo/logo_no_bg.webp';
    centerName = 'Little Steps Early Learning Center';
    location = '124 Babesa Zur Lam SE, Thimphu';
    aboutText =
        'Providing quality early childhood education since 2020. Our center offers a nurturing environment for children ages 6 months to 5 years.';

    // Contact Info
    contactInfo = {
        phone: '+975 17263764',
        email: 'info@littlestepselc.com',
        website: 'www.littlestepselc.com',
        address: '124 Babesa Zur Lam SE, Thimphu',
    };

    // Stats
    stats = {
        followers: 1243,
        likes: 1567,
        checkins: 892,
    };

    // Tabs
    activeTab: string = 'timeline';

    // Posting
    newPostContent: string = '';
    showPostModal: boolean = false;
    uploadedFiles: any[] = [];

    // Events
    events: Event[] = [
        {
            id: 1,
            title: 'Summer Program Open House',
            date: new Date(2023, 5, 15),
            startTime: '10:00 AM',
            endTime: '2:00 PM',
            description:
                'Come visit our center and learn about our summer programs for children ages 2-5.',
            location: 'Main Campus',
        },
        {
            id: 2,
            title: 'Parent-Teacher Conferences',
            date: new Date(2023, 5, 20),
            startTime: '3:00 PM',
            endTime: '7:00 PM',
            description:
                "Meet with your child's teacher to discuss their progress and development.",
            location: 'Classrooms',
        },
        {
            id: 3,
            title: 'Annual Sports Day',
            date: new Date(2023, 6, 5),
            startTime: '9:00 AM',
            endTime: '12:00 PM',
            description:
                'Fun sports activities for all age groups. Parents are welcome to attend!',
            location: 'Playground',
        },
    ];

    // Photos
    photos = [
        {
            itemImageSrc: 'assets/images/eccdcoverimage.jpg',
            thumbnailImageSrc: 'assets/images/eccdcoverimage.jpg',
            alt: 'Classroom activities',
            title: 'Learning Time',
        },
        {
            itemImageSrc:
                'https://www.bbs.bt/wp-content/uploads/2022/11/ECCD.jpg',
            thumbnailImageSrc:
                'https://www.bbs.bt/wp-content/uploads/2022/11/ECCD.jpg',
            alt: 'Outdoor play',
            title: 'Playground Fun',
        },
        {
            itemImageSrc:
                'https://images.unsplash.com/photo-1527631746610-bca00a040d60?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
            thumbnailImageSrc:
                'https://images.unsplash.com/photo-1527631746610-bca00a040d60?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
            alt: 'Art class',
            title: 'Creative Arts',
        },
        {
            itemImageSrc:
                'https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
            thumbnailImageSrc:
                'https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
            alt: 'Story time',
            title: 'Story Circle',
        },
    ];

    responsiveOptions: any[] = [
        {
            breakpoint: '1024px',
            numVisible: 5,
        },
        {
            breakpoint: '768px',
            numVisible: 3,
        },
        {
            breakpoint: '560px',
            numVisible: 1,
        },
    ];

    // Posts
    posts: Post[] = [
        {
            id: 1,
            author: 'Little Steps Early Learning Center',
            avatar: 'assets/logo/logo_no_bg.webp',
            content:
                'Our summer program registration is now open! Limited spots available for ages 2-5. Contact us to schedule a tour!',
            image: 'https://www.bbs.bt/wp-content/uploads/2022/11/ECCD.jpg',
            likes: 45,
            comments: 12,
            shares: 5,
            timeAgo: '2 hours ago',
            isLiked: false,
        },
        {
            id: 2,
            author: 'Little Steps Early Learning Center',
            avatar: 'assets/logo/logo_no_bg.webp',
            content:
                'Check out our new outdoor play area! The kids are loving the new climbing structure and sandbox.',
            image: 'assets/images/eccdcoverimage.jpg',
            likes: 78,
            comments: 15,
            shares: 8,
            timeAgo: '1 day ago',
            isLiked: true,
        },
        {
            id: 3,
            author: 'Yeshi Choden',
            avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
            content:
                "My daughter has been attending Little steps for 6 months now and we couldn't be happier with her progress. The teachers are amazing!",
            likes: 32,
            comments: 4,
            shares: 1,
            timeAgo: '3 days ago',
            isLiked: false,
        },
    ];

    showChatPanel: boolean = false;
    currentChat: ChatContact | null = null;
    chatMessage: string = '';
    chatContacts: ChatContact[] = [
        {
            id: 1,
            name: 'Yeshi Choden',
            avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
            role: 'Parent',
            class: 'Toddler A',
            lastMessage: 'Hi, when is the next parent meeting?',
            unreadCount: 2,
            online: true,
        },
        {
            id: 2,
            name: 'Nima Yoezer',
            avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
            role: 'Parent',
            class: 'Preschool B',
            lastMessage: 'Thanks for the update!',
            unreadCount: 0,
            online: false,
        },
        {
            id: 3,
            name: 'Kinley Wangyel',
            avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
            role: 'Class Coordinator',
            class: 'Toddler A',
            lastMessage: 'Please check the materials list',
            unreadCount: 1,
            online: true,
        },
        {
            id: 4,
            name: 'Dorji Penjor',
            avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
            role: 'Administrator',
            lastMessage: 'Meeting at 3pm tomorrow',
            unreadCount: 0,
            online: false,
        },
    ];

    activeCategory: string = 'all';
    displayPhotoDialog: boolean = false;
    selectedPhoto: any = null;

    chatMessages: ChatMessage[] = [
        {
            id: 1,
            senderId: 1,
            content: 'Hi, when is the next parent meeting?',
            timestamp: new Date(Date.now() - 3600000),
            isOwn: false,
        },
        {
            id: 2,
            senderId: 0, // Facility
            content: 'The next meeting is on June 15th at 10am',
            timestamp: new Date(Date.now() - 1800000),
            isOwn: true,
        },
        {
            id: 3,
            senderId: 1,
            content: 'Thanks! Will there be any special activities?',
            timestamp: new Date(Date.now() - 900000),
            isOwn: false,
        },
    ];

    constructor() {}

    ngOnInit() {}

    likePost(post: Post) {
        if (post.isLiked) {
            post.likes--;
        } else {
            post.likes++;
        }
        post.isLiked = !post.isLiked;
    }

    createPost() {
        if (this.newPostContent.trim() || this.uploadedFiles.length > 0) {
            const newPost: Post = {
                id: this.posts.length + 1,
                author: 'Little Steps Early Learning Center',
                avatar: this.profileImage,
                content: this.newPostContent,
                likes: 0,
                comments: 0,
                shares: 0,
                timeAgo: 'Just now',
                isLiked: false,
            };

            if (this.uploadedFiles.length > 0) {
                newPost.image = URL.createObjectURL(this.uploadedFiles[0]);
            }

            this.posts.unshift(newPost);
            this.newPostContent = '';
            this.uploadedFiles = [];
            this.showPostModal = false;
        }
    }

    setActiveTab(tab: string) {
        this.activeTab = tab;
    }

    onUpload(event: any) {
        for (let file of event.files) {
            this.uploadedFiles.push(file);
        }
    }

    removeFile(index: number) {
        this.uploadedFiles.splice(index, 1);
    }

    getEventMonth(event: Event): string {
        return event.date
            .toLocaleString('default', { month: 'short' })
            .toUpperCase();
    }

    getEventDay(event: Event): string {
        return event.date.getDate().toString();
    }

    toggleChatPanel() {
        this.showChatPanel = !this.showChatPanel;
    }

    selectChat(contact: ChatContact) {
        this.currentChat = contact;
        contact.unreadCount = 0; // Mark as read

        this.loadChatMessages(contact.id);
    }
    loadChatMessages(contactId: number) {
        // In a real app, you would fetch messages from a service
        // For now, we'll simulate different conversations
        this.chatMessages = [
            {
                id: 1,
                senderId: contactId,
                content: `Hello from ${
                    this.chatContacts.find((c) => c.id === contactId)?.name
                }`,
                timestamp: new Date(Date.now() - 3600000),
                isOwn: false,
            },
            {
                id: 2,
                senderId: 0, // Facility
                content: 'Thank you for your message! How can we help?',
                timestamp: new Date(Date.now() - 1800000),
                isOwn: true,
            },
            {
                id: 3,
                senderId: contactId,
                content: 'Just checking about the upcoming event',
                timestamp: new Date(Date.now() - 900000),
                isOwn: false,
            },
        ];
    }

    sendMessage() {
        if (this.chatMessage.trim() && this.currentChat) {
            const newMessage: ChatMessage = {
                id: this.chatMessages.length + 1,
                senderId: 0, // Facility
                content: this.chatMessage,
                timestamp: new Date(),
                isOwn: true,
            };
            this.chatMessages.push(newMessage);
            this.chatMessage = '';

            // Update last message in contact list
            this.currentChat.lastMessage = newMessage.content;
        }
    }

    getFilteredContacts(role?: string, classGroup?: string): ChatContact[] {
        return this.chatContacts.filter((contact) => {
            if (role && contact.role !== role) return false;
            if (classGroup && contact.class !== classGroup) return false;
            return true;
        });
    }

    getMessagesForCurrentChat(): ChatMessage[] {
        if (!this.currentChat) return [];
        // In a real app, you would filter messages for the current chat
        return this.chatMessages;
    }
}
