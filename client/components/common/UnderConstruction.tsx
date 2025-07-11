// components/common/UnderConstruction.tsx

import { Construction, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface UnderConstructionProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
}

export default function UnderConstruction({
  title = "Tính năng đang phát triển",
  description = "Chúng tôi đang nỗ lực hoàn thiện chức năng này. Vui lòng quay lại sau!",
  showBackButton = true,
}: UnderConstructionProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="bg-yellow-100 dark:bg-yellow-900/20 p-6 rounded-full mb-6">
        <Construction className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        {title}
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-md">
        {description}
      </p>
      {showBackButton && (
        <Button onClick={() => navigate(-1)} className="mt-6">
          Quay lại
        </Button>
      )}
    </div>
  );
}
