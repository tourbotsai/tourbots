"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Lightbulb, CheckCircle } from "lucide-react";

interface TourInfoCardProps {
  onAddTour?: () => void;
}

export function TourInfoCard({ onAddTour }: TourInfoCardProps) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold text-slate-900">
          <Lightbulb className="mr-2 h-5 w-5 text-indigo-500" />
          Tour setup guidance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          TourBots is bring-your-own-tour. Upload your Matterport link to get started.
        </p>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success-green" />
            <div>
              <h4 className="text-sm font-medium text-slate-900">
                Add your primary Matterport tour
              </h4>
              <p className="text-xs text-slate-600">
                Connect your live tour URL and configure AI guidance in minutes.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success-green" />
            <div>
              <h4 className="text-sm font-medium text-slate-900">
                Expand with additional spaces
              </h4>
              <p className="text-xs text-slate-600">
                Add more tours as you scale, each with its own AI menu and tracking.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button 
            variant="outline"
            onClick={onAddTour}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Matterport Tour
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 