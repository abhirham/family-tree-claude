"use client";

const HumanAvatar = ({ gender = "male", size = 160, seed = 0 }) => {
  // Generate consistent but varied avatars based on seed
  const variants = {
    male: {
      skinTones: ["#FDBCB4", "#F1C27D", "#E0AC69", "#D29962", "#C68642"],
      hairColors: ["#2C1B18", "#8B4513", "#D2691E", "#DEB887", "#F4A460"],
      hairStyles: [
        // Short hair
        "M20,40 Q20,25 30,20 Q50,15 70,20 Q80,25 80,40 L80,50 Q70,45 50,45 Q30,45 20,50 Z",
        // Wavy hair
        "M15,45 Q15,25 25,18 Q35,15 50,15 Q65,15 75,18 Q85,25 85,45 Q80,40 75,42 Q70,38 65,40 Q60,35 55,38 Q50,33 45,38 Q40,35 35,40 Q30,38 25,42 Q20,40 15,45 Z",
        // Curly hair
        "M18,50 Q15,30 25,20 Q35,12 50,12 Q65,12 75,20 Q85,30 82,50 Q78,45 72,48 Q68,42 62,46 Q58,40 52,44 Q48,40 42,46 Q38,42 32,48 Q28,45 22,50 Q20,48 18,50 Z",
      ],
      shirtColors: ["#1a1a1a", "#4a4a4a", "#2563eb", "#dc2626", "#059669"],
    },
    female: {
      skinTones: ["#FDBCB4", "#F1C27D", "#E0AC69", "#D29962", "#C68642"],
      hairColors: [
        "#2C1B18",
        "#8B4513",
        "#D2691E",
        "#DEB887",
        "#F4A460",
        "#FFD700",
      ],
      hairStyles: [
        // Long straight
        "M12,60 Q12,25 25,15 Q40,8 50,8 Q60,8 75,15 Q88,25 88,60 Q85,70 80,75 Q75,80 70,82 Q65,85 60,82 Q55,80 50,82 Q45,80 40,82 Q35,85 30,82 Q25,80 20,75 Q15,70 12,60 Z",
        // Wavy long
        "M10,65 Q10,30 22,18 Q35,10 50,10 Q65,10 78,18 Q90,30 90,65 Q88,75 82,80 Q78,85 72,82 Q68,78 62,80 Q58,75 52,78 Q48,75 42,80 Q38,78 32,82 Q28,85 22,80 Q15,75 12,65 Q10,68 10,65 Z",
        // Shoulder length
        "M15,55 Q15,25 28,16 Q40,10 50,10 Q60,10 72,16 Q85,25 85,55 Q82,65 75,68 Q70,70 65,68 Q60,65 55,68 Q50,65 45,68 Q40,65 35,68 Q30,70 25,68 Q18,65 15,55 Z",
      ],
      shirtColors: ["#ec4899", "#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444"],
    },
  };

  const config = variants[gender] || variants.male;

  // Use seed to get consistent variations
  const skinTone = config.skinTones[Math.abs(seed) % config.skinTones.length];
  const hairColor =
    config.hairColors[Math.abs(seed * 2) % config.hairColors.length];
  const hairStyle =
    config.hairStyles[Math.abs(seed * 3) % config.hairStyles.length];
  const shirtColor =
    config.shirtColors[Math.abs(seed * 4) % config.shirtColors.length];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="rounded-full"
      style={{ backgroundColor: "#f3f4f6" }}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="50" fill="#f3f4f6" />

      {/* Shirt/Clothing */}
      <path
        d="M20,85 Q20,75 25,72 Q30,70 35,72 Q40,75 45,72 Q50,70 55,72 Q60,75 65,72 Q70,70 75,72 Q80,75 80,85 L80,100 L20,100 Z"
        fill={shirtColor}
      />

      {/* Neck */}
      <ellipse cx="50" cy="75" rx="8" ry="12" fill={skinTone} />

      {/* Face */}
      <ellipse cx="50" cy="45" rx="18" ry="22" fill={skinTone} />

      {/* Hair */}
      <path d={hairStyle} fill={hairColor} />

      {/* Eyes */}
      <ellipse cx="42" cy="42" rx="2" ry="3" fill="#2c3e50" />
      <ellipse cx="58" cy="42" rx="2" ry="3" fill="#2c3e50" />

      {/* Eye highlights */}
      <ellipse cx="43" cy="41" rx="0.8" ry="1" fill="white" />
      <ellipse cx="59" cy="41" rx="0.8" ry="1" fill="white" />

      {/* Nose */}
      <ellipse
        cx="50"
        cy="48"
        rx="1.5"
        ry="2"
        fill="none"
        stroke={skinTone}
        strokeWidth="0.5"
        opacity="0.3"
      />

      {/* Mouth */}
      <path
        d="M46,54 Q50,57 54,54"
        stroke="#d63384"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Eyebrows */}
      <path
        d="M39,37 Q42,35 45,37"
        stroke={hairColor}
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M55,37 Q58,35 61,37"
        stroke={hairColor}
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />

      {gender === "female" && (
        <>
          {/* Earrings */}
          <circle cx="32" cy="48" r="1.5" fill="#ffd700" />
          <circle cx="68" cy="48" r="1.5" fill="#ffd700" />

          {/* Eyelashes */}
          <path d="M41,40 L41,38" stroke="#2c3e50" strokeWidth="0.5" />
          <path d="M43,39 L43,37" stroke="#2c3e50" strokeWidth="0.5" />
          <path d="M57,39 L57,37" stroke="#2c3e50" strokeWidth="0.5" />
          <path d="M59,40 L59,38" stroke="#2c3e50" strokeWidth="0.5" />
        </>
      )}
    </svg>
  );
};

export default HumanAvatar;
