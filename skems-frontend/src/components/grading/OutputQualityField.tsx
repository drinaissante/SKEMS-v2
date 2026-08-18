import type { FormData } from "../../constants/gradingConstants";
import { computeOutputQuality } from "../../services/supabase";

interface OutputQualityFieldProps {
    form: FormData
}

export default function OutputQualityField({
    form
}: OutputQualityFieldProps) {
    return (
        <div className="text-sm text-[#a6a6a6]">
            Output Quality:{" "}
            <span className="font-medium text-[#fdb125]">
                {(
                    computeOutputQuality(
                        form.tech_execution,
                        form.creative_impact,
                        form.brand_alignment,
                        form.revision_factor,
                    ) * 100
                ).toFixed(1)}
                %
            </span>
        </div>
    )
}