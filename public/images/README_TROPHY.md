# Trophy Image Setup

The badge generator now expects a trophy image at:
`public/images/trophy.png`

## To add the trophy image:

1. Save the attached gold trophy image as `trophy.png`
2. Place it in the `public/images/` directory

The generator will:
- Load the image automatically when generating PDFs
- Fall back to a simple vector trophy if the image isn't found
- Use the image in both single and batch badge generation

## Current trophy specifications:
- Size: 28mm x 28mm on the badge
- Position: Left side, near the top
- Format: PNG with transparency recommended
- The trophy should have a gold/yellow color scheme to match the ticket theme

If you need to adjust the trophy size or position, edit these values in `src/lib/badgeGenerator.ts`:
```typescript
const trophySize = 28;  // Size in mm
const trophyX = 12;     // X position
const trophyY = 8;      // Y position
```
