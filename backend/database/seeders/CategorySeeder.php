<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Brake Parts',
                'image_path' => '/images/pos-system/brake_pads.png',
                'description' => 'Brake pads, discs, and related components'
            ],
            [
                'name' => 'Hoses Parts',
                'image_path' => '/images/pos-system/hoses.png',
                'description' => 'Hoses and tubing for various applications'
            ],
            [
                'name' => 'Electrical Parts',
                'image_path' => '/images/pos-system/electrical_parts_motorparts.png',
                'description' => 'Electrical components and wiring'
            ],
            [
                'name' => 'Engine Parts',
                'image_path' => '/images/pos-system/engine_spare.png',
                'description' => 'Engine components and spare parts'
            ],
            [
                'name' => 'Body Parts',
                'image_path' => '/images/pos-system/motor_sidemirror.png',
                'description' => 'Body panels and exterior components'
            ],
            [
                'name' => 'Transmission Parts',
                'image_path' => '/images/pos-system/sprockets.png',
                'description' => 'Transmission and drivetrain components'
            ],
            [
                'name' => 'Accessories Parts',
                'image_path' => '/images/pos-system/shock_absorber.png',
                'description' => 'Accessories and add-on parts'
            ],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['name' => $category['name']],
                $category
            );
        }
    }
}
