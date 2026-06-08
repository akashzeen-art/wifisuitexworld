package com.wifiextender.ui.dashboard.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.wifiextender.data.model.Plan
import com.wifiextender.databinding.ItemPlanBinding

class PlanAdapter(
    private val currentPlanId: Long?,
    private val onSelect: (Plan) -> Unit
) : ListAdapter<Plan, PlanAdapter.ViewHolder>(DiffCallback) {

    inner class ViewHolder(private val binding: ItemPlanBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(plan: Plan) {
            binding.tvPlanName.text  = plan.name
            binding.tvPlanPrice.text = when (plan.planType) {
                "FREE_TRIAL" -> "Free"
                "LIFETIME"   -> "$${plan.price} one-time"
                else         -> "$${plan.price}/mo"
            }
            binding.tvPlanDevices.text = if (plan.unlimitedDevices) "∞ Unlimited devices"
                else "${plan.maxDevices} devices"
            binding.tvPlanDuration.text = when {
                plan.lifetime     -> "Lifetime"
                plan.durationDays != null -> "${plan.durationDays} days"
                else              -> "—"
            }
            binding.tvFeatures.text = plan.featureList.take(3).joinToString("\n") { "✓ $it" }

            val isCurrent = plan.id == currentPlanId
            binding.btnSelect.text = if (isCurrent) "Current Plan" else "Get Started"
            binding.btnSelect.isEnabled = !isCurrent
            binding.btnSelect.alpha = if (isCurrent) 0.5f else 1f
            binding.btnSelect.setOnClickListener { if (!isCurrent) onSelect(plan) }

            if (plan.popular) {
                binding.tvPopular.visibility = android.view.View.VISIBLE
            } else {
                binding.tvPopular.visibility = android.view.View.GONE
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemPlanBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) = holder.bind(getItem(position))

    companion object DiffCallback : DiffUtil.ItemCallback<Plan>() {
        override fun areItemsTheSame(a: Plan, b: Plan) = a.id == b.id
        override fun areContentsTheSame(a: Plan, b: Plan) = a == b
    }
}
