import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { ImageModule } from 'primeng/image';
import { DamageItemService } from 'src/app/core/dataservice/damage-item/damage-item.dataservice';
import { DamageItemDTO } from 'src/app/core/dataservice/damage-item/damage.item.dto';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { SidebarModule } from 'primeng/sidebar';
import { DamageItemChatBoxComponent } from '../../../lease/components/damage-item-chat-box/damage-item-chat-box.component';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';

@Component({
    selector: 'app-admin-dashboard-damage-items',
    templateUrl: './admin-dashboard-damage-items.component.html',
    styleUrls: ['./admin-dashboard-damage-items.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        ImageModule,
        ButtonModule,
        DividerModule,
        SidebarModule,
        DamageItemChatBoxComponent,
        OverlayPanelModule,
    ],
})
export class AdminDashboardDamageItemsComponent implements OnInit {
    damageItems: DamageItemDTO[] = [];
    selectedDamageItem: DamageItemDTO | null = null;
    @ViewChild('op') overlayPanel: OverlayPanel;

    constructor(
        private damageItemDataService: DamageItemService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.damageItemDataService
            .GetAllDamageItemByAdmin(this.authService.GetAuthenticatedUser().id)
            .subscribe({
                next: (res) => {
                    this.damageItems = res;
                },
            });
    }

    loadChat(item: any, event: Event) {
        this.selectedDamageItem = item;

        this.overlayPanel.toggle(event); // Or use show(event) if you only want to open
    }
}
