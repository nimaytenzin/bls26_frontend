import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms'; // Add FormsModule for [(ngModel)]
import { CommonModule } from '@angular/common';
import {
    DamageItemDTO,
    DamageItemThreamDTO,
} from 'src/app/core/dataservice/damage-item/damage.item.dto';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { DamageItemService } from 'src/app/core/dataservice/damage-item/damage-item.dataservice';
import { Avatar, AvatarModule } from 'primeng/avatar';
import { AuthenticatedUserDTO } from 'src/app/core/dataservice/users-and-auth/dto/auth.dto';

@Component({
    selector: 'app-damage-item-chat-box',
    templateUrl: './damage-item-chat-box.component.html',
    styleUrls: ['./damage-item-chat-box.component.css'],
    standalone: true,
    imports: [
        InputGroupModule,
        InputGroupAddonModule,
        InputTextModule,
        ButtonModule,
        DividerModule,
        FormsModule,
        AvatarModule,
        CommonModule,
    ],
})
export class DamageItemChatBoxComponent
    implements OnInit, OnChanges, OnDestroy
{
    @Input() damageItem!: DamageItemDTO;

    threads: DamageItemThreamDTO[] = [];
    newMessage: string = '';

    authenticatedUser: AuthenticatedUserDTO;
    pollingInterval: any;
    @ViewChild('chatContainer') chatContainer!: ElementRef;

    constructor(
        private authService: AuthService,
        private damageItemDataService: DamageItemService
    ) {
        this.authenticatedUser = this.authService.GetAuthenticatedUser();
    }
    ngOnDestroy(): void {
        this.stopPolling();
    }

    ngOnInit() {
        if (this.damageItem) {
            this.loadDamageItemThreads();
            this.startPolling();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['damageItem'] && changes['damageItem'].currentValue) {
            this.loadDamageItemThreads();
            this.startPolling();
        }
    }

    private loadDamageItemThreads(): void {
        this.damageItemDataService
            .GetDamageItemThreadByDamageItem(this.damageItem.id)
            .subscribe({
                next: (res) => {
                    this.threads = res;
                    this.scrollToBottom();
                },
                error: (err) => {
                    console.error('Error loading threads:', err);
                },
            });
    }

    private startPolling(): void {
        this.pollingInterval = setInterval(() => {
            this.loadDamageItemThreads();
        }, 120000);
    }

    private stopPolling(): void {
        if (this.pollingInterval) {
            console.log('polling stopped');
            clearInterval(this.pollingInterval);
        }
    }

    private scrollToBottom(): void {
        try {
            setTimeout(() => {
                this.chatContainer.nativeElement.scrollTop =
                    this.chatContainer.nativeElement.scrollHeight;
            }, 100); // Small timeout to ensure DOM updates before scrolling
        } catch (err) {
            console.error('Error while scrolling to bottom:', err);
        }
    }

    sendMessage() {
        this.damageItemDataService
            .CreateDamageItemThread({
                damageItemId: this.damageItem.id,
                text: this.newMessage,
                userId: this.authService.GetAuthenticatedUser().id,
            })
            .subscribe((res) => {
                this.threads = res;
                this.newMessage = null;
                this.scrollToBottom();
            });
    }
}
