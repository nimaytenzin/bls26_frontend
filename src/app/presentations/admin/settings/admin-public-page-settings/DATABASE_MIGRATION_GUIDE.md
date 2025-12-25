# Public Page Settings Database Migration Guide

This document describes how to convert the public page settings from localStorage to a database-backed solution.

## Current Implementation

The settings are currently stored in localStorage using the `PublicPageSettingsService`. The settings include:
- Map visualization mode
- Basemap selection
- Color scale
- National data viewer title, description, info box content, and stats

## Database Entity Design

### Table: `public_page_settings`

```sql
CREATE TABLE public_page_settings (
    id SERIAL PRIMARY KEY,
    
    -- Map Configuration
    map_visualization_mode VARCHAR(50) NOT NULL DEFAULT 'households',
        CHECK (map_visualization_mode IN ('households', 'enumerationAreas')),
    selected_basemap_id VARCHAR(100) NOT NULL DEFAULT 'positron',
    color_scale VARCHAR(50) NOT NULL DEFAULT 'blue',
        CHECK (color_scale IN ('blue', 'green', 'red', 'purple', 'orange', 'gray', 'viridis', 'plasma')),
    
    -- Page Content
    national_data_viewer_title VARCHAR(255) NOT NULL DEFAULT 'National Sampling Frame',
    national_data_viewer_description TEXT,
    national_data_viewer_info_box_content TEXT,
    national_data_viewer_info_box_stats VARCHAR(255),
    
    -- Audit Fields
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_public_page_settings UNIQUE (id) -- Only one settings record allowed
);

-- Create a unique constraint to ensure only one settings record exists
-- Alternative: Use a singleton pattern with id = 1 always
CREATE UNIQUE INDEX idx_public_page_settings_singleton ON public_page_settings (id) WHERE id = 1;
```

### Entity Class (Backend - NestJS/TypeORM Example)

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum MapVisualizationMode {
  HOUSEHOLDS = 'households',
  ENUMERATION_AREAS = 'enumerationAreas',
}

export enum ColorScaleType {
  BLUE = 'blue',
  GREEN = 'green',
  RED = 'red',
  PURPLE = 'purple',
  ORANGE = 'orange',
  GRAY = 'gray',
  VIRIDIS = 'viridis',
  PLASMA = 'plasma',
}

@Entity('public_page_settings')
export class PublicPageSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: MapVisualizationMode.HOUSEHOLDS,
  })
  mapVisualizationMode: MapVisualizationMode;

  @Column({
    type: 'varchar',
    length: 100,
    default: 'positron',
  })
  selectedBasemapId: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: ColorScaleType.BLUE,
  })
  colorScale: ColorScaleType;

  @Column({
    type: 'varchar',
    length: 255,
    default: 'National Sampling Frame',
  })
  nationalDataViewerTitle: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  nationalDataViewerDescription: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  nationalDataViewerInfoBoxContent: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  nationalDataViewerInfoBoxStats: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## DTOs (Data Transfer Objects)

### Request DTOs

```typescript
// UpdatePublicPageSettingsDto.ts
export class UpdatePublicPageSettingsDto {
  mapVisualizationMode?: 'households' | 'enumerationAreas';
  selectedBasemapId?: string;
  colorScale?: string;
  nationalDataViewerTitle?: string;
  nationalDataViewerDescription?: string;
  nationalDataViewerInfoBoxContent?: string;
  nationalDataViewerInfoBoxStats?: string;
}
```

### Response DTO

```typescript
// PublicPageSettingsDto.ts
export class PublicPageSettingsDto {
  id: number;
  mapVisualizationMode: 'households' | 'enumerationAreas';
  selectedBasemapId: string;
  colorScale: string;
  nationalDataViewerTitle: string;
  nationalDataViewerDescription: string;
  nationalDataViewerInfoBoxContent: string;
  nationalDataViewerInfoBoxStats: string;
  createdBy?: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
}
```

## Backend API Endpoints

### REST API Design

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/public-page-settings` | Get current public page settings | No (public) |
| GET | `/api/admin/public-page-settings` | Get settings (admin endpoint) | Yes (Admin) |
| PUT | `/api/admin/public-page-settings` | Update settings | Yes (Admin) |
| POST | `/api/admin/public-page-settings/reset` | Reset to defaults | Yes (Admin) |

### Example Backend Controller (NestJS)

```typescript
import { Controller, Get, Put, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PublicPageSettingsService } from './public-page-settings.service';
import { UpdatePublicPageSettingsDto } from './dto/update-public-page-settings.dto';
import { PublicPageSettingsDto } from './dto/public-page-settings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@Controller('public-page-settings')
export class PublicPageSettingsController {
  constructor(
    private readonly publicPageSettingsService: PublicPageSettingsService,
  ) {}

  @Get()
  async getSettings(): Promise<PublicPageSettingsDto> {
    return this.publicPageSettingsService.getSettings();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getSettingsAdmin(): Promise<PublicPageSettingsDto> {
    return this.publicPageSettingsService.getSettings();
  }

  @Put('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async updateSettings(
    @Body() updateDto: UpdatePublicPageSettingsDto,
    @Request() req,
  ): Promise<PublicPageSettingsDto> {
    return this.publicPageSettingsService.updateSettings(
      updateDto,
      req.user.id,
    );
  }

  @Post('admin/reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async resetSettings(@Request() req): Promise<PublicPageSettingsDto> {
    return this.publicPageSettingsService.resetToDefaults(req.user.id);
  }
}
```

### Example Backend Service (NestJS)

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicPageSettings } from './entities/public-page-settings.entity';
import { UpdatePublicPageSettingsDto } from './dto/update-public-page-settings.dto';
import { PublicPageSettingsDto } from './dto/public-page-settings.dto';

@Injectable()
export class PublicPageSettingsService {
  private readonly DEFAULT_SETTINGS = {
    mapVisualizationMode: 'households',
    selectedBasemapId: 'positron',
    colorScale: 'blue',
    nationalDataViewerTitle: 'National Sampling Frame',
    nationalDataViewerDescription: 'Current statistics on households and enumeration areas',
    nationalDataViewerInfoBoxContent:
      'A sampling frame is a population from which a sample can be drawn, ensuring survey samples are representative and reliable.',
    nationalDataViewerInfoBoxStats: '3,310 EAs total (1,464 urban, 1,846 rural)',
  };

  constructor(
    @InjectRepository(PublicPageSettings)
    private readonly settingsRepository: Repository<PublicPageSettings>,
  ) {}

  async getSettings(): Promise<PublicPageSettingsDto> {
    let settings = await this.settingsRepository.findOne({ where: { id: 1 } });

    if (!settings) {
      // Create default settings if none exist
      settings = this.settingsRepository.create({
        id: 1,
        ...this.DEFAULT_SETTINGS,
      });
      settings = await this.settingsRepository.save(settings);
    }

    return this.toDto(settings);
  }

  async updateSettings(
    updateDto: UpdatePublicPageSettingsDto,
    userId: number,
  ): Promise<PublicPageSettingsDto> {
    let settings = await this.settingsRepository.findOne({ where: { id: 1 } });

    if (!settings) {
      settings = this.settingsRepository.create({
        id: 1,
        ...this.DEFAULT_SETTINGS,
        ...updateDto,
        createdBy: { id: userId } as any,
        updatedBy: { id: userId } as any,
      });
    } else {
      Object.assign(settings, updateDto);
      settings.updatedBy = { id: userId } as any;
    }

    settings = await this.settingsRepository.save(settings);
    return this.toDto(settings);
  }

  async resetToDefaults(userId: number): Promise<PublicPageSettingsDto> {
    let settings = await this.settingsRepository.findOne({ where: { id: 1 } });

    if (settings) {
      Object.assign(settings, this.DEFAULT_SETTINGS);
      settings.updatedBy = { id: userId } as any;
      settings = await this.settingsRepository.save(settings);
    } else {
      settings = this.settingsRepository.create({
        id: 1,
        ...this.DEFAULT_SETTINGS,
        createdBy: { id: userId } as any,
        updatedBy: { id: userId } as any,
      });
      settings = await this.settingsRepository.save(settings);
    }

    return this.toDto(settings);
  }

  private toDto(entity: PublicPageSettings): PublicPageSettingsDto {
    return {
      id: entity.id,
      mapVisualizationMode: entity.mapVisualizationMode,
      selectedBasemapId: entity.selectedBasemapId,
      colorScale: entity.colorScale,
      nationalDataViewerTitle: entity.nationalDataViewerTitle,
      nationalDataViewerDescription: entity.nationalDataViewerDescription,
      nationalDataViewerInfoBoxContent: entity.nationalDataViewerInfoBoxContent,
      nationalDataViewerInfoBoxStats: entity.nationalDataViewerInfoBoxStats,
      createdBy: entity.createdBy?.id,
      updatedBy: entity.updatedBy?.id,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
```

## Frontend Implementation

### Updated Service Interface

```typescript
// public-page-settings.interface.ts
export interface PublicPageSettings {
  mapVisualizationMode: 'households' | 'enumerationAreas';
  selectedBasemapId: string;
  colorScale: string;
  nationalDataViewerTitle: string;
  nationalDataViewerDescription: string;
  nationalDataViewerInfoBoxContent: string;
  nationalDataViewerInfoBoxStats: string;
}

export interface PublicPageSettingsDto extends PublicPageSettings {
  id: number;
  createdBy?: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
}
```

### Updated Service Implementation

The service should:
1. Fetch from API instead of localStorage
2. Cache settings in memory/service state
3. Use the public endpoint for read operations
4. Use the admin endpoint for write operations

## Migration Steps

1. **Backend Setup:**
   - Create database migration/entity
   - Create DTOs
   - Implement controller and service
   - Add routes and guards

2. **Frontend Update:**
   - Update service to use HTTP client
   - Remove localStorage dependency
   - Update component to handle async loading
   - Add error handling and loading states

3. **Data Migration:**
   - Script to migrate existing localStorage data to database (if needed)
   - Set default values in database

4. **Testing:**
   - Test public endpoint (no auth)
   - Test admin endpoints (with auth)
   - Test reset functionality
   - Verify settings persistence

## Singleton Pattern Note

Since there should only be one settings record, consider:
- Using a fixed ID (e.g., `id = 1`)
- Adding a database constraint to prevent multiple records
- Or using a singleton pattern in the service layer

