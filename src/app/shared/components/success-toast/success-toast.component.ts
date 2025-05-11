import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-success-toast',
  templateUrl: './success-toast.component.html',
  styleUrls: ['./success-toast.component.scss'],
  standalone: true,
	imports: [CommonModule]
})
export class SuccessToastComponent {
  @Input() message = 'Operation completed successfully!';
  @Input() visible = false;
}
